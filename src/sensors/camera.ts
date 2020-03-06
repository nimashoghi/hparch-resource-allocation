import {promises as fs} from "fs"
import {from, merge, of} from "rxjs"
import {delay, mergeMap} from "rxjs/operators"
import {Sensor} from "../types"

const AVERAGE_TIME = 0.5

type Timeline = {
    timestamp: number
    label: number
    location: string
}[]

export interface CameraData {
    isActive: boolean
}

export const camera: Sensor<CameraData> = async () => {
    const {timeline}: {timeline: Timeline} = JSON.parse(
        (await fs.readFile("./shared/timelines/sign-timeline.json")).toString(),
    )

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
