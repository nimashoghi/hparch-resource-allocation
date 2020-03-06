import {bufferCount, map, reduce, startWith, tap} from "rxjs/operators"
import {plot} from "./chart"
import {config} from "./config"
import {camera, imu, microphone} from "./sensors"
import {distance} from "./util"

const MOVE_THRESHOLD = 0.2
const SLIDING_WINDOW_SIZE = 5

const getDistanceOf = (
    positions: {
        timestamp: number
        gyroscope: [number, number, number]
        accelerometer: [number, number, number]
    }[],
) => {
    if (positions.length === 0 || positions.length === 1) {
        return 0
    }

    const [first, ...rest] = positions

    let totalDistance = 0
    let previous = first
    for (const current of rest) {
        totalDistance += distance(current.accelerometer, previous.accelerometer)
        previous = current
    }

    return totalDistance / positions.length
}

export default config(
    {
        camera,
        imu,
        microphone,
    },
    {
        visual_slam: ({imu}) =>
            imu.pipe(
                tap(({accelerometer, gyroscope}) => {
                    plot(
                        "Accelerometer",
                        "Accelerometer",
                        Math.sqrt(
                            accelerometer[0] ** 2 +
                                accelerometer[1] ** 2 +
                                accelerometer[2] ** 2,
                        ),
                    )
                    plot(
                        "Gyroscope",
                        "Gyroscope",
                        Math.sqrt(
                            gyroscope[0] ** 2 +
                                gyroscope[1] ** 2 +
                                gyroscope[2] ** 2,
                        ),
                    )
                }),
                bufferCount(10, 1),
                map(
                    ([fst, ...rest]) =>
                        rest.reduce(
                            (acc, {accelerometer}) =>
                                acc +
                                distance(accelerometer, fst.accelerometer),
                            0.0,
                        ) /
                        (rest.length + 1),
                ),
                reduce(
                    ({count, sum}, curr) => ({
                        count: count + 1,
                        curr,
                        sum: sum + curr,
                    }),
                    {count: 0, curr: 0, sum: 0},
                ),
                map(({count, curr, sum}) => curr / (sum / count)),
                tap(value => plot("Distance", "Distance", value)),
                startWith(1.0),
            ),
        // visual_slam: ({angles}) =>
        //     angles.pipe(
        //         tap(({pitch, roll}) => {
        //             plot("pitch", "pitch", pitch)
        //             plot("roll", "roll", roll)
        //         }),
        //         pairwise(),
        //         map(([prev, curr]) =>
        //             Math.max(
        //                 Math.abs(cuvaluerr.pitch - prev.pitch) / 360,
        //                 Math.abs(curr.roll - prev.roll) / 360,
        //             ),
        //         ),
        //         map(distanceMoved =>
        //             Math.min(1.0 * (distanceMoved / 0.02), 3.0),
        //         ),
        //         // low pass filter
        //         pairwise(),
        //         map(([prev, curr]) => prev * 0.95 + curr * 0.5),
        //         tap(distanceMoved =>
        //             plot("Distance Moved", "Visual SLAM", distanceMoved),
        //         ),
        //         startWith(1.0),
        //     ),

        command_recognition: ({microphone}) =>
            microphone.pipe(
                map(({isActive}) => {
                    if (isActive) {
                        return 1.0
                    } else {
                        return 0.1
                    }
                }),
                startWith(1.0),
            ),

        // sign_recognition: ({camera}) =>
        //     camera.pipe(
        //         map(({isActive}) => {
        //             if (isActive) {
        //                 return 2.5
        //             } else {
        //                 return 0.35
        //             }
        //         }),
        //         startWith(0.35),
        //     ),
    },
)
