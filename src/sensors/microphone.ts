import {from, of, merge} from "rxjs"
import {delay, mergeMap} from "rxjs/operators"
import {timeline} from "../../shared/timelines/audio-timeline.json"
import {Sensor} from "../types"

export interface MicrophoneData {
    isActive: boolean
}

export const microphone: Sensor<MicrophoneData> = async () => {
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
