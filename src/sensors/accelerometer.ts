import csv from "csvtojson"
import {from, of} from "rxjs"
import {delay, flatMap} from "rxjs/operators"
import {Sensor} from "../types"
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
    const data = ((await csv().fromFile(path)) as IMURow[])
        .map(({a_RS_S_x, a_RS_S_y, a_RS_S_z, timestamp}) => ({
            // the input dataset has the timestamp in units of ns, so we divide by 1e9 to get seconds
            timestamp: parseInt(timestamp) / 1e9,
            accelerometer: [a_RS_S_x, a_RS_S_y, a_RS_S_z].map(value =>
                parseFloat(value),
            ) as Vec3,
        }))
        .filter(
            ({timestamp}) =>
                timestamp >= 1403636627613555456 &&
                timestamp <= 1403636645063555584,
        )
    return from(data).pipe(
        flatMap(value =>
            of(value).pipe(delay((value.timestamp - data[0].timestamp) * 1000)),
        ),
    )
}

export interface Accelerometer {
    timestamp: number
    accelerometer: Vec3
}

export const accelerometer: Sensor<Accelerometer> = async () =>
    await readCsv("./data.csv")
