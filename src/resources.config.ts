import {bufferCount, map, startWith} from "rxjs/operators"
import {config} from "./config"
import {camera, imu, microphone} from "./sensors"
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
        imu,
        camera,
        microphone,
    },
    {
        visual_slam: ({imu}) =>
            imu.pipe(
                bufferCount(SLIDING_WINDOW_SIZE, 1),
                map(positions =>
                    getDistanceOf(positions) >= MOVE_THRESHOLD ? 5.0 : 0.5,
                ),
                startWith(2.5),
            ),

        command_recognition: ({microphone}) =>
            microphone.pipe(
                map(({isActive}) => (isActive ? 1.0 : 0.1)),
                startWith(0.1),
            ),

        "random-computation": ({camera}) =>
            camera.pipe(
                map(({isActive}) => {
                    if (isActive) {
                        return 2.5
                    } else {
                        return 0.35
                    }
                }),
                startWith(0.35),
            ),
    },
)
