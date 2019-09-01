import {Observable} from "rxjs"

export interface DockerComposeConfig {
    version: string
    services: {[name: string]: {}}
    volumes: {}
}
