import {promises as fs} from "fs"

const readFile = async (name: string) => {
    const lines = (await fs.readFile(name)).toString().split("\n")

    let totalTime = 0
    for (const line_ of lines) {
        const line: string = line_.trim()
        if (line === "") {
            continue
        }

        const [_, , , duration] = line.split(",")
        totalTime += parseInt(duration)
    }

    return (totalTime * 1e-9) / lines.length
}

readFile("MH_02_easy-local_mapping.csv") // ?
