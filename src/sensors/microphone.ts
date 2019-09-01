import {interval} from "rxjs"
import {map} from "rxjs/operators"

export default async () =>
    interval(500).pipe(
        map(i => ({
            isActive: i % 2 === 0,
        })),
    )
