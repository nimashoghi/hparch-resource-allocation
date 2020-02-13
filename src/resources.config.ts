import {bufferCount, map, startWith} from "rxjs/operators"
import {config} from "./config"
import {accelerometer, microphone, camera} from "./sensors"
import {distance} from "./util"
import {empty} from "rxjs"

const MOVE_THRESHOLD = 0.2
const SLIDING_WINDOW_SIZE = 5

const getDistanceOf = (
    positions: {
        timestamp: number
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
        accelerometer,
        camera,
        microphone,
    },
    {
        visual_slam: () => empty(),
        command_recognition: () => empty(),
        sign_recognition: () => empty(),

        // visual_slam: ({accelerometer}) =>
        //     accelerometer.pipe(
        //         bufferCount(SLIDING_WINDOW_SIZE, 1),
        //         map(positions => {
        //             const distanceMoved = getDistanceOf(positions)
        //             if (distanceMoved >= MOVE_THRESHOLD) {
        //                 return 5.0
        //             } else {
        //                 return 2.5
        //             }
        //         }),
        //         startWith(2.5),
        //     ),

        // command_recognition: ({microphone}) =>
        //     microphone.pipe(
        //         map(({isActive}) => {
        //             if (isActive) {
        //                 return 1.0
        //             } else {
        //                 return 0.1
        //             }
        //         }),
        //         startWith(0.1),
        //     ),

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
