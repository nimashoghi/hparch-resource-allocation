import {execFile, execSync} from "child_process"
import Docker from "dockerode"

const realtimeSchedulerFile = "/sys/fs/cgroup/cpu.rt_runtime_us"
const hasRealtimeScheduler = false

const getNumCpus = () =>
    parseInt(
        execSync(`lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l`)
            .toString()
            .trim(),
        10,
    )

const docker = new Docker()
const numCpus = getNumCpus()

export const getAllContainers = async (
    serviceKey = "com.docker.compose.service",
) =>
    new Set<string>(
        (await docker.listContainers())
            .map(({Labels}) => Labels[serviceKey])
            .filter(value => !!value),
    )
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

// const RESERVED_TIMESLICE = 500000
const RESERVED_TIMESLICE = 100000
const REALTIME_PERIOD = 1000000 - RESERVED_TIMESLICE
export const setWeight = async (
    id: string,
    weight: number,
    realtimePeriod = REALTIME_PERIOD,
) => {
    if (hasRealtimeScheduler) {
        const runtime = Math.trunc(weight * realtimePeriod)
        await runDockerCommand("update", `--cpu-rt-runtime=${runtime}`, id)
    } else {
        const cpus = weight * numCpus
        await runDockerCommand("update", `--cpus=${cpus.toFixed(1)}`, id)
    }
}
