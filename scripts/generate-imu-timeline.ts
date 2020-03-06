import csv from "csvtojson"
import {promises as fs} from "fs"

type Vec3 = [number, number, number]

interface IMURow {
    timestamp: string
    w_RS_S_x: string
    w_RS_S_y: string
    w_RS_S_z: string
    a_RS_S_x: string
    a_RS_S_y: string
    a_RS_S_z: string
}

const readCsv = async (path: string) => {
    const data = ((await csv().fromFile(path)) as IMURow[]).map(
        ({
            a_RS_S_x,
            a_RS_S_y,
            a_RS_S_z,
            timestamp,
            w_RS_S_x,
            w_RS_S_y,
            w_RS_S_z,
        }) => ({
            // the input dataset has the timestamp in units of ns, so we divide by 1e9 to get seconds
            timestamp: parseInt(timestamp) / 1e9,
            accelerometer: [a_RS_S_x, a_RS_S_y, a_RS_S_z].map(value =>
                parseFloat(value),
            ) as Vec3,
            gyroscope: [w_RS_S_x, w_RS_S_y, w_RS_S_z].map(value =>
                parseFloat(value),
            ) as Vec3,
        }),
    )

    const first = data[0]
    return data.map(({accelerometer, gyroscope, timestamp}) => ({
        accelerometer,
        gyroscope,
        timestamp: timestamp - first.timestamp,
    }))
}

const main = async () => {
    const timeline = await readCsv("./data.csv")

    await fs.writeFile(
        "./shared/timelines/imu-timeline.json",
        JSON.stringify({eventCount: timeline.length, timeline}, undefined, 4),
    )
}

main().catch(console.error)
