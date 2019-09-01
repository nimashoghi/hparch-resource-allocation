import {of} from "rxjs"
import {bufferCount, map} from "rxjs/operators"
import {config} from "./config"
import accelerometer from "./sensors/accelerometer"
import microphone from "./sensors/microphone"
import {distance} from "./util"

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
        microphone,
    },
    {
        visual_slam: ({accelerometer}) =>
            accelerometer.pipe(
                bufferCount(SLIDING_WINDOW_SIZE, 1),
                map(positions => {
                    const distanceMoved = getDistanceOf(positions)
                    if (distanceMoved <= MOVE_THRESHOLD) {
                        return 0.75
                    } else {
                        return 0.25
                    }
                }),
            ),

        command_recognition: ({microphone}) => of(0),

        sign_recognition: () => of(0),
    },
)
