import {promises as fs} from "fs"
import path from "path"
//@ts-ignore
import labels from "/home/nimas/Downloads/signs/test.json"

const settings = {
    maxDuration: 15,
    delayBetweenCommands: 3,
    delayRandomOffset: 1,
}

const imagePath = "/home/nimas/Downloads/signs/test/"
const outPath = "http://192.168.1.5:8080/signs/test"
const getRandomDelay = () =>
    settings.delayBetweenCommands + Math.random() * settings.delayRandomOffset

const pickRandom = <T>(items: T[]) =>
    items[Math.floor(Math.random() * items.length)]

const main = async () => {
    const subFiles = await fs.readdir(imagePath)
    const images = subFiles
        .filter(location => !!(labels as any)[location])
        .map(location => ({
            location: `${outPath}/${location}`,
            localLocation: path.join(imagePath, location),
            label: (labels as any)[location],
        }))

    const timeline = []

    let totalSeconds = 0
    while (totalSeconds < settings.maxDuration) {
        const {label, location} = pickRandom(images)
        timeline.push({timestamp: totalSeconds, label, location})
        totalSeconds += getRandomDelay()
    }

    await fs.writeFile(
        "./shared/timelines/sign-timeline.json",
        JSON.stringify({eventCount: timeline.length, timeline}, undefined, 4),
    )
}

main().catch(console.error)
