import {promises as fs} from "fs"
import {from, merge, of} from "rxjs"
import {delay, mergeMap, pairwise, scan, tap} from "rxjs/operators"
import {Sensor} from "../types"
import {Vec3} from "../util"
import {plot} from "../chart"

type Timeline = {
    accelerometer: [number, number, number]
    gyroscope: [number, number, number]
    timestamp: number
}[]

export interface IMU {
    accelerometer: Vec3
    gyroscope: Vec3
    timestamp: number
}

export interface Angles {
    pitch: number
    roll: number
    timestamp: number
}

export const imu: Sensor<IMU> = async () => {
    const {timeline}: {timeline: Timeline} = JSON.parse(
        (await fs.readFile("./shared/timelines/imu-timeline.json")).toString(),
    )

    return from(timeline).pipe(
        mergeMap(data =>
            merge(
                of(data).pipe(
                    delay((data.timestamp - timeline[0].timestamp) * 1000),
                ),
            ),
        ),
    )
}

const GYROSCOPE_SENSITIVITY = 1.14381898

export const angles: Sensor<Angles> = async () =>
    (await imu()).pipe(
        pairwise(),
        // tap(([prev, curr]) => {
        //     plot(
        //         "Accelerometer Diff",
        //         "Accelerometer Diff",
        //         Math.sqrt(
        //             curr.accelerometer[0] ** 2 +
        //                 curr.accelerometer[1] ** 2 +
        //                 curr.accelerometer[2] ** 2,
        //         ) -
        //             Math.sqrt(
        //                 prev.accelerometer[0] ** 2 +
        //                     prev.accelerometer[1] ** 2 +
        //                     prev.accelerometer[2] ** 2,
        //             ),
        //     )
        //     plot(
        //         "Gyroscope Diff",
        //         "Gyroscope Diff",
        //         Math.sqrt(
        //             curr.gyroscope[0] ** 2 +
        //                 curr.gyroscope[1] ** 2 +
        //                 curr.gyroscope[2] ** 2,
        //         ) -
        //             Math.sqrt(
        //                 prev.gyroscope[0] ** 2 +
        //                     prev.gyroscope[1] ** 2 +
        //                     prev.gyroscope[2] ** 2,
        //             ),
        //     )
        // }),
        scan(
            (acc, [prev, {accelerometer, gyroscope, timestamp}]) => {
                const dt = timestamp - prev.timestamp

                let pitch =
                    acc.pitch + (gyroscope[0] / GYROSCOPE_SENSITIVITY) * dt
                let roll =
                    acc.roll - (gyroscope[1] / GYROSCOPE_SENSITIVITY) * dt

                const forceMagnitudeApprox =
                    Math.abs(accelerometer[0]) +
                    Math.abs(accelerometer[1]) +
                    Math.abs(accelerometer[2])
                if (
                    forceMagnitudeApprox > 9.81 / 2 &&
                    forceMagnitudeApprox <= 9.81 * 2
                ) {
                    const pitchAcc =
                        (Math.atan2(accelerometer[1], accelerometer[2]) * 180) /
                        Math.PI
                    pitch = pitch * 0.98 + pitchAcc * 0.02

                    const rollAcc =
                        (Math.atan2(accelerometer[0], accelerometer[2]) * 180) /
                        Math.PI
                    roll = roll * 0.98 + rollAcc * 0.02
                }

                return {pitch, roll, timestamp}
            },
            {pitch: 0, roll: 0, timestamp: 0},
        ),
    )
