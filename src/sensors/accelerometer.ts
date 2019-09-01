import csv from "csvtojson"
import {Observable} from "rxjs"
import {Vec3} from "../util"

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
    const [first, ...data] = ((await csv().fromFile(path)) as IMURow[]).map(
        ({a_RS_S_x, a_RS_S_y, a_RS_S_z, timestamp}) => ({
            // the input dataset has the timestamp in units of ns, so we divide by 1e9 to get seconds
            timestamp: parseInt(timestamp) / 1e9,
            accelerometer: [a_RS_S_x, a_RS_S_y, a_RS_S_z].map(value =>
                parseFloat(value),
            ) as Vec3,
        }),
    )

    return new Observable<typeof first>(observer => {
        const unsubscribe: (() => void)[] = []

        observer.next(first)
        for (const row of data) {
            const timeDifferenceSeconds = row.timestamp - first.timestamp
            const handle = setTimeout(
                () => observer.next(row),
                timeDifferenceSeconds * 1000,
            )

            unsubscribe.push(() => clearTimeout(handle))
        }

        return () => unsubscribe.forEach(f => f())
    })
}

export default async () =>
    await readCsv("/home/nimas/Repositories/resource-allocation-node/data.csv")
