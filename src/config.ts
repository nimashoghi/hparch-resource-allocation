import {promises as fs} from "fs"
import yaml from "js-yaml"
import {Observable} from "rxjs"
import {DockerComposeConfig} from "./types"

export type UnwrapPromise<T> = T extends Promise<infer Inner> ? Inner : T

export interface Sensors {
    [name: string]: () => Promise<Observable<any>>
}
export type ConstructedSensors<TSensors extends Sensors = Sensors> = {
    [Key in keyof TSensors]: UnwrapPromise<ReturnType<TSensors[Key]>>
}

export interface Modules<TSensors extends Sensors = Sensors> {
    [name: string]: (
        sensors: ConstructedSensors<TSensors>,
    ) => Observable<number> | Promise<Observable<number>>
}

export interface Config<TSensors extends Sensors = Sensors> {
    sensors: TSensors
    modules: Modules<TSensors>
}

export const config = <TSensors extends Sensors = Sensors>(
    sensors: TSensors,
    modules: Modules<TSensors>,
): Config<TSensors> => ({
    sensors,
    modules,
})

export const getConfigPath = () =>
    "/home/nimas/Repositories/resource-allocation-node/src/resources.config.ts"
export const getDockerComposePath = () =>
    "/home/nimas/Repositories/resource-allocation-node/docker-compose.yml"
export const loadConfig = async (path: string): Promise<Config> =>
    (await import(path)).default
export const loadYaml = async (path: string): Promise<DockerComposeConfig> =>
    yaml.safeLoad((await fs.readFile(path)).toString())

export const checkConfig = (
    configValues: string[],
    dockerComposeValues: string[],
) => {
    function* check(
        arr: string[],
        against: string[],
        arrName: string,
        againstName: string,
    ) {
        for (const value of arr) {
            if (!against.includes(value)) {
                yield `Could not find key ${value} (from ${arrName}) in ${againstName}`
            }
        }
    }

    const errors = [
        ...check(
            configValues,
            dockerComposeValues,
            "resources config",
            "docker compose config",
        ),
        ...check(
            dockerComposeValues,
            configValues,
            "docker compose config",
            "resources config",
        ),
    ]
    if (errors.length) {
        throw new Error(errors.join("\n"))
    }
}
