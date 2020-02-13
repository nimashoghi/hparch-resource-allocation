import {promises as fs} from "fs"

const count = 350
const og = "/home/nimas/Downloads/slam/timestamps-in.txt"
const outFile = "/home/nimas/Downloads/slam/timestamps.txt"

const main = async () => {
    const ogContent = (await fs.readFile(og))
        .toString()
        .split("\n")
        .map(line => line.trim())
        .filter(line => !!line)
    const start = Math.floor(Math.random() * (ogContent.length - count - 1))
    const end = start + count
    await fs.writeFile(outFile, ogContent.slice(start, end).join("\n"))
}

main().catch(console.error)
