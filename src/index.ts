import {combineLatest} from "rxjs"
import {
    bufferTime,
    distinctUntilChanged,
    map,
    tap,
    filter,
} from "rxjs/operators"
import {inspect} from "util"
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
import {getDockerContainerFor, setWeight} from "./docker"
import {foreachAsync, mapAsync, mapOptionAsync, toObject} from "./util"

const BUFFER_DURATION = 100

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
        async ([name, f]) =>
            (await Promise.resolve(f(sensors))).pipe(
                distinctUntilChanged(),
                map(value => ({name, value})),
                tap(({name, value}) =>
                    console.log(`${name} changed to ${value}`),
                ),
            ),
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
    )
}

const main = async () => {
    console.log(`Starting the service...`)

    const config = await parseConfig({
        compose: getDockerComposePath(),
        config: getConfigPath(),
    })
    console.log(`Parsed configs`)

    const sensors = await initializeSensors(config.sensors)
    const modules = await initializeModules(sensors, config.modules)

    modules.subscribe(async weights => {
        console.log(`Received the following weights: ${inspect(weights)}`)
        const weightsArray = await mapOptionAsync(
            Object.entries(weights),
            async ([name, weight]) => {
                const container = await getDockerContainerFor(name)
                if (!container) {
                    console.warn(
                        `Could not find container for docker container ${name}!`,
                    )
                    return undefined
                }
                return {container, name, weight} as const
            },
        )
        const sum = weightsArray.reduce((acc, {weight}) => acc + weight, 0)
        // if the sum is 0, then just quit right now
        if (!sum) {
            console.warn(`The sum of received weights equals zero.`)
            return
        }
        const adjustedWeights = weightsArray.map(
            ({container, name, weight}) => ({
                container,
                name,
                weight: weight / sum,
            }),
        )
        console.log(
            `Adjusted weights. Setting Docker weights to: ${inspect(
                toObject(adjustedWeights, ({name, weight}) => [name, weight]),
            )}`,
        )
        await foreachAsync(adjustedWeights, async ({container, weight}) => {
            await setWeight(container.Id, weight)
        })
    })
}

main().catch(console.error)
