import {promises as fs} from "fs"
import path from "path"
import {getAudioDurationInSeconds} from "get-audio-duration"

const settings = {
    maxDuration: 185,
    delayBetweenCommands: 6,
    delayRandomOffset: 3,
}

const basePath = "/home/nimas/Downloads/commands/"

const commands = [
    "yes",
    "no",
    "up",
    "down",
    "left",
    "right",
    "on",
    "off",
    "stop",
]

const pickRandom = <T>(items: T[]) =>
    items[Math.floor(Math.random() * items.length)]

const getRandomCommand = async () => {
    const command = pickRandom(commands)
    const wavFiles = await fs.readdir(path.join(basePath, command))
    const location = path.join(basePath, command, pickRandom(wavFiles))
    return {command, location}
}

const getRandomDelay = () =>
    settings.delayBetweenCommands + Math.random() * settings.delayRandomOffset

const main = async () => {
    const timeline = []

    let totalSeconds = 0
    while (totalSeconds < settings.maxDuration) {
        const {command, location} = await getRandomCommand()
        const duration = await getAudioDurationInSeconds(location)
        timeline.push({timestamp: totalSeconds, command, location, duration})

        const totalDuration = getRandomDelay() - duration
        totalSeconds += totalDuration
    }

    await fs.writeFile(
        "./audio-timeline.json",
        JSON.stringify({eventCount: timeline.length, timeline}, undefined, 4),
    )
}

main().catch(console.error)
