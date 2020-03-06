import {promises as fs} from "fs"
//@ts-ignore
import {cpu, mem} from "node-os-utils"
import {plot} from "./chart"

const getHardwareUsage = async (): Promise<{
    cpuUsage: number
    usedMemPercentage: number
}> => {
    const [cpuUsage, {freeMemPercentage}] = await Promise.all([
        cpu.usage(),
        mem.info(),
    ])
    return {cpuUsage, usedMemPercentage: 100 - freeMemPercentage}
}

export const measureCpuUsage = async (
    fileName = "./shared/out/cpu-load.csv",
    interval = 1000,
) => {
    await fs.writeFile(fileName, "time,cpu,memory\n")
    setInterval(async () => {
        const {cpuUsage, usedMemPercentage} = await getHardwareUsage()
        // plot("CPU Usage", "CPU Usage", cpuUsage)
        // plot("Memory Usage", "Memory Usage", usedMemPercentage)

        const row = [
            `${Date.now()}`,
            `${cpuUsage}`,
            `${usedMemPercentage}`,
        ].join(",")
        await fs.appendFile(fileName, `${row}\n`)
    }, interval)
}
