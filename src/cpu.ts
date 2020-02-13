import {promises as fs} from "fs"
//@ts-ignore
import {cpu, mem} from "node-os-utils"

export const measureCpuUsage = async (
    fileName = "./shared/out/cpu-load.csv",
    interval = 1000,
) => {
    await fs.writeFile(fileName, "time,cpu,memory\n")
    setInterval(async () => {
        const [cpuUsage, {freeMemPercentage}] = await Promise.all([
            cpu.usage(),
            mem.info(),
        ])
        const row = [
            `${Date.now()}`,
            `${cpuUsage}`,
            `${100.0 - freeMemPercentage}`,
        ].join(",")
        await fs.appendFile(fileName, `${row}\n`)
    }, interval)
}
