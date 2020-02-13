import {Observable} from "rxjs"

export interface DockerComposeConfig {
    version: string
    services: {[name: string]: {}}
    volumes: {}
}

export type Sensor<T> = () => Promise<Observable<T>>
