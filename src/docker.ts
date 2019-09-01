import {execFile} from "child_process"
import Docker from "dockerode"
import {existsSync} from "fs"

const realtimeSchedulerFile = "/sys/fs/cgroup/cpu.rt_runtime_us"
const hasRealtimeScheduler = existsSync(realtimeSchedulerFile)

const docker = new Docker()
export const getDockerContainerFor = async (
    name: string,
    serviceKey = "com.docker.compose.service",
) =>
    (await docker.listContainers()).find(
        ({Labels}) => Labels[serviceKey] === name,
    )

export const runDockerCommand = async (...args: readonly string[]) =>
    await new Promise<{stdout: string; stderr: string}>((resolve, reject) => {
        execFile("docker", args, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                resolve({stdout, stderr})
            }
        })
    })

export const setWeight = async (
    id: string,
    weight: number,
    realtimePeriod = 1000000,
) => {
    if (hasRealtimeScheduler) {
        await runDockerCommand(
            "update",
            `--cpu-rt-runtime=${Math.trunc(weight / realtimePeriod)}`,
            id,
        )
    } else {
        await runDockerCommand("update", `--cpus=${weight.toFixed(1)}`, id)
    }
}
