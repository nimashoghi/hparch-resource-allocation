import {promises as fs} from "fs"
import path from "path"
//@ts-ignore
import labels from "../../sign-detection/data/test.json"

const settings = {
    maxDuration: 185,
    delayBetweenCommands: 3,
    delayRandomOffset: 1,
}

const imagePath = "/home/nimas/Repositories/sign-detection/data/test"
const getRandomDelay = () =>
    settings.delayBetweenCommands + Math.random() * settings.delayRandomOffset

const pickRandom = <T>(items: T[]) =>
    items[Math.floor(Math.random() * items.length)]

const main = async () => {
    const subFiles = await fs.readdir(imagePath)
    const images = subFiles
        .filter(location => !!labels[location])
        .map(location => ({
            location: path.join(imagePath, location),
            label: labels[location],
        }))
    images // ?

    const timeline = []

    let totalSeconds = 0
    while (totalSeconds < settings.maxDuration) {
        const {label, location} = pickRandom(images)
        timeline.push({timestamp: totalSeconds, label, location})
        totalSeconds += getRandomDelay()
    }

    await fs.writeFile(
        "./sign-timeline.json",
        JSON.stringify({eventCount: timeline.length, timeline}, undefined, 4),
    )
}

main().catch(console.error)
