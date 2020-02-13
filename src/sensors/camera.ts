import {from, of, merge} from "rxjs"
import {delay, mergeMap} from "rxjs/operators"
import {timeline} from "../../shared/timelines/sign-timeline.json"
import {Sensor} from "../types"

const AVERAGE_TIME = 0.75

export interface CameraData {
    isActive: boolean
}

export const camera: Sensor<CameraData> = async () => {
    return from(timeline).pipe(
        mergeMap(data => {
            const startDelay = (data.timestamp - timeline[0].timestamp) * 1000
            return merge(
                of({isActive: true}).pipe(delay(startDelay)),
                of({isActive: false}).pipe(
                    delay(startDelay + AVERAGE_TIME * 1000),
                ),
            )
        }),
    )
}
