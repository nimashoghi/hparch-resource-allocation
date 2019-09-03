export interface DockerComposeConfig {
    version: string
    services: {[name: string]: {}}
    volumes: {}
}
