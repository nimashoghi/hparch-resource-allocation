import {existsSync, promises as fs} from "fs"
import net from "net"
import {Observable, ReplaySubject} from "rxjs"
import {flatMap, map, scan} from "rxjs/operators"
import {plot, startSocketServer} from "./chart"

export interface DroppedFrame {
    count: number
    source: string
    timestamp: number
}

type DroppedFramesMap = {
    [source: string]: number
}

const server = async (filePath: string) => {
    try {
        await fs.stat(filePath)
        await fs.unlink(filePath)
    } catch {}

    const subject = new ReplaySubject<Buffer>()
    const observable = new Observable<Buffer>(observer => {
        const server = net.createServer(socket => {
            socket.on("data", data => observer.next(data))
        })
        server.on("connection", socket => {
            console.log("connected")
            const subscription = subject.subscribe(value => socket.write(value))
            socket.on("close", () => {
                console.log("disconnected")
                subscription.unsubscribe()
            })
        })
        server.on("close", () => observer.complete())
        server.listen(filePath, () => console.log("Started socket server!"))
    })
    return [observable, subject] as const
}

const droppedFramesObservable = async (socketPath: string) => {
    if (existsSync(socketPath)) {
        await fs.unlink(socketPath)
    }

    const [observable] = await server(socketPath)

    const startTime = Date.now()

    return observable.pipe(
        flatMap(data =>
            data
                .toString()
                .split(";;;;")
                .filter(part => !!part)
                .map(part => JSON.parse(part) as DroppedFrame),
        ),
        scan(
            ([acc], {source, timestamp}) => {
                const count = (acc[source] ?? 0) + 1
                return [
                    {...acc, [source]: count},
                    {count, source, timestamp},
                ] as [DroppedFramesMap, DroppedFrame]
            },
            [{}, {count: 0, source: "", timestamp: 0}] as [
                DroppedFramesMap,
                DroppedFrame,
            ],
        ),
        map(([, frame]) => ({
            ...frame,
            timestamp: new Date(startTime + frame.timestamp * 1000),
        })),
    )
}

export const droppedFramesMain = async () => {
    const observable = await droppedFramesObservable("./server.sock")
    return observable.subscribe(({count, source, timestamp}) => {
        // plot("Dropped Frames", source, [timestamp, count])
    })
}

if (require.main === module) {
    const main = async () => {
        startSocketServer()
        await droppedFramesMain()
    }

    main().catch(console.error)
}
