import {promises as fs} from "fs"
import {getAudioDurationInSeconds} from "get-audio-duration"
import path from "path"

const settings = {
    maxDuration: 15,
    delayBetweenCommands: 3,
    delayRandomOffset: 1,
}

const basePath = "/home/nimas/Downloads/commands/"
const outBasePath = "http://192.168.1.5:8080/commands"

const commands = [
    // "yes",
    // "no",
    "up",
    "down",
    "left",
    "right",
    // "on",
    // "off",
    // "stop",
]

const pickRandom = <T>(items: T[]) =>
    items[Math.floor(Math.random() * items.length)]

const getRandomCommand = async () => {
    const command = pickRandom(commands)
    const wavFiles = await fs.readdir(path.join(basePath, command))
    const wavFile = pickRandom(wavFiles)
    const localLocation = path.join(basePath, command, wavFile)
    const location = `${outBasePath}/${command}/${wavFile}`
    return {command, localLocation, location}
}

const getRandomDelay = () =>
    settings.delayBetweenCommands + Math.random() * settings.delayRandomOffset

const main = async () => {
    const timeline = []

    let totalSeconds = 0
    while (totalSeconds < settings.maxDuration) {
        const {command, location, localLocation} = await getRandomCommand()
        const duration = await getAudioDurationInSeconds(localLocation)
        timeline.push({timestamp: totalSeconds, command, location, duration})

        totalSeconds += getRandomDelay()
    }

    await fs.writeFile(
        "./shared/timelines/audio-timeline.json",
        JSON.stringify({eventCount: timeline.length, timeline}, undefined, 4),
    )
}

main().catch(console.error)
