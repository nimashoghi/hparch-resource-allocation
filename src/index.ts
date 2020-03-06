import deepEqual from "deep-equal"
import {promises as fs} from "fs"
import {combineLatest, interval} from "rxjs"
import {
    bufferTime,
    distinctUntilChanged,
    filter,
    flatMap,
    map,
    share,
} from "rxjs/operators"
import {plot, startSocketServer} from "./chart"
import {
    checkConfig,
    ConstructedSensors,
    getConfigPath,
    getDockerComposePath,
    loadConfig,
    loadYaml,
    Modules,
    Sensors,
} from "./config"
import {measureCpuUsage} from "./cpu"
import {getAllContainers, getDockerContainerFor, setWeight} from "./docker"
import {droppedFramesMain} from "./dropped-frames"
import {foreachAsync, mapAsync, mapOptionAsync, toObject} from "./util"

const BUFFER_DURATION = 100
const INTERVAL_LENGTH = 1000

const dockerInterval = interval(INTERVAL_LENGTH).pipe(
    flatMap(async () => await getAllContainers()),
    share(),
)
const watchDockerContainer = (name: string) =>
    dockerInterval.pipe(
        map(values => values.has(name)),
        distinctUntilChanged((lhs, rhs) =>
            deepEqual(lhs, rhs, {
                strict: true,
            }),
        ),
        // tap(value =>
        //     console.log(`Container ${name} went ${value ? "up" : "down"}`),
        // ),
    )

const parseConfig = async (path: {compose: string; config: string}) => {
    const [config, compose] = await Promise.all([
        loadConfig(path.config),
        loadYaml(path.compose),
    ])
    checkConfig(Object.keys(config.modules), Object.keys(compose.services))
    return config
}

const initializeSensors = async (sensors: Sensors) =>
    toObject(
        await mapAsync(
            Object.entries(sensors),
            async ([name, f]) =>
                [
                    name,
                    (await Promise.resolve(f())).pipe(distinctUntilChanged()),
                ] as const,
        ),
        sensor => sensor,
    ) as ConstructedSensors

const initializeModules = async (
    sensors: ConstructedSensors,
    modulesObject: Modules,
) => {
    const moduleWeights = await mapAsync(
        Object.entries(modulesObject),
        async ([name, f]) => {
            const weightUpdated = await Promise.resolve(f(sensors))
            const containerStatusUpdated = watchDockerContainer(name)
            return combineLatest([weightUpdated, containerStatusUpdated]).pipe(
                map(([value, containerActive]) => ({
                    name,
                    value: containerActive ? value : 0,
                })),
                distinctUntilChanged(
                    (lhs, rhs) =>
                        lhs.value === rhs.value && lhs.name === rhs.name,
                ),
                // tap(({name, value}) =>
                //     console.log(`${name} changed to ${value}`),
                // ),
            )
        },
    )

    return combineLatest(moduleWeights).pipe(
        bufferTime(BUFFER_DURATION),
        // bufferTime will call at BUFFER_DURATION regardless of change, so we filter that condition
        filter(values => values.length !== 0),

        map(values =>
            values.flat().reduce(
                (acc, {name, value}) => ({
                    ...acc,
                    [name]: value,
                }),
                {} as Record<string, number>,
            ),
        ),
        share(),
    )
}

const sleep = async (interval: number) =>
    await new Promise<void>(resolve =>
        setInterval(() => resolve(), interval * 1000),
    )

const preStart = async (path = "./shared/start.txt") => {
    await fs.writeFile(path, "0")
}

const start = async (path = "./shared/start.txt") => {
    await fs.writeFile(path, "1")
}

let startTime: number
let endTime: number

const finished = () => {
    console.log(
        `Finished! Start: ${new Date(startTime)}; End: ${new Date(
            endTime,
        )}; Duration: ${(endTime - startTime) / 1000}`,
    )
}

let weightsSet = false
const writeWeights = async (
    weights: {name: string; weight: number}[],
    file = "./shared/out/weights.csv",
) => {
    if (!weightsSet) {
        await fs.writeFile(file, `time,name,weight`)
        weightsSet = true
    }
    const time = `${Date.now()}`
    const content = weights
        .map(({name, weight}) => [time, name, `${weight}`].join(","))
        .join("\n")
    await fs.appendFile(file, `${content}\n`)
}

const main = async () => {
    console.log(`Starting the service...`)

    await preStart()

    startSocketServer()
    const droppedFramesSub = await droppedFramesMain()

    const config = await parseConfig({
        compose: getDockerComposePath(),
        config: getConfigPath(),
    })
    console.log(`Parsed configs`)

    const sensors = await initializeSensors(config.sensors)
    const modules = await initializeModules(sensors, config.modules)

    console.log("Waiting for 5 seconds before starting...")
    await sleep(5)
    console.log("Starting now...")
    await start()

    startTime = Date.now()
    measureCpuUsage()
    const modulesSubscription = modules.subscribe(async weights => {
        const weightsEntries = Object.entries(weights)
        for (const [name, weight] of weightsEntries) {
            plot("Absolute Weights", name, weight)
        }

        // console.log(`Received the following weights: ${inspect(weights)}`)
        const weightsArrayUnfiltered = await mapOptionAsync(
            weightsEntries,
            async ([name, weight]) => {
                const container = await getDockerContainerFor(name)
                if (!container) {
                    console.log(
                        `Could not find container for docker container ${name}!`,
                    )
                    return undefined
                }
                return {container, name, weight} as const
            },
        )
        const weightsArray = weightsArrayUnfiltered.filter(
            value => value !== undefined,
        )
        const sum = weightsArray.reduce((acc, {weight}) => acc + weight, 0)
        // if the sum is 0, then just quit right now
        if (!sum) {
            console.log(`The sum of received weights equals zero.`)
            return
        }
        const adjustedWeights = weightsArray.map(
            ({container, name, weight}) => ({
                container,
                name,
                weight: weight / sum,
            }),
        )
        writeWeights(adjustedWeights).catch(console.error)
        // console.log(
        //     `Adjusted weights. Setting Docker weights to: ${inspect(
        //         toObject(adjustedWeights, ({name, weight}) => [name, weight]),
        //     )}`,
        // )
        await foreachAsync(
            adjustedWeights,
            async ({container, name, weight}) => {
                await setWeight(container.Id, weight, name)
            },
        )
    })

    const allModulesDisabledSubscription = dockerInterval
        .pipe(
            filter(
                values =>
                    Object.keys(config.modules).filter(key => values.has(key))
                        .length === 0,
            ),
        )
        .subscribe(() => {
            endTime = Date.now()
            droppedFramesSub.unsubscribe()
            modulesSubscription.unsubscribe()
            allModulesDisabledSubscription.unsubscribe()
            finished()
        })
}

main().catch(console.error)
