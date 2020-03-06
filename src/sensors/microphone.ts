import {promises as fs} from "fs"
import {from, merge, of} from "rxjs"
import {delay, mergeMap} from "rxjs/operators"
import {Sensor} from "../types"

type Timeline = {
    timestamp: number
    command: string
    location: string
    duration: number
}[]

export interface MicrophoneData {
    isActive: boolean
}

export const microphone: Sensor<MicrophoneData> = async () => {
    const {timeline}: {timeline: Timeline} = JSON.parse(
        (
            await fs.readFile("./shared/timelines/audio-timeline.json")
        ).toString(),
    )

    return from(timeline).pipe(
        mergeMap(data => {
            const startDelay = (data.timestamp - timeline[0].timestamp) * 1000
            return merge(
                of({isActive: true}).pipe(delay(startDelay)),
                of({isActive: false}).pipe(
                    delay(startDelay + data.duration * 1000),
                ),
            )
        }),
    )
}
