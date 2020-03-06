import {promises as fs} from "fs"
import {Subject} from "rxjs"
import {bufferTime, filter, map} from "rxjs/operators"
import socket from "socket.io"

interface DataPoint {
    chartName: string
    name: string
    values: [Date, number][]
}
const newDataPointSubject = new Subject<DataPoint>()

const FILE_OUT = "./plot-data.txt"

export const plot = async (
    chartName: string,
    name: string,
    ...values: (number | [Date, number])[]
) => {
    // await fs.appendFile(
    //     FILE_OUT,
    //     `${JSON.stringify({
    //         chartName,
    //         name,
    //         values: values.map(value =>
    //             typeof value === "number" ? [new Date(), value] : value,
    //         ),
    //     })}\n`,
    // )
    newDataPointSubject.next({
        chartName,
        name,
        values: values.map(value =>
            typeof value === "number" ? [new Date(), value] : value,
        ),
    })
}

const groupBy = <T>(list: T[], key: (value: T) => string) =>
    Object.values(
        list.reduce((grouped, curr) => {
            const prevKey = key(curr)
            const prev = grouped[prevKey]

            return {...grouped, [prevKey]: [...(prev ?? []), curr]}
        }, {} as Record<string, T[]>),
    )

const normalize = (datapoints: DataPoint[]) =>
    groupBy(datapoints, ({chartName, name}) => `${chartName}::${name}`).map(
        datapoint =>
            ({
                ...datapoint[0],
                values: datapoint.flatMap(({values}) => values),
            } as DataPoint),
    )

export const startSocketServer = (port = 8085) => {
    const io = socket(port)
    return newDataPointSubject
        .pipe(
            bufferTime(250),
            map(datapoints => normalize(datapoints)),
            filter(datapoints => datapoints.length !== 0),
        )
        .subscribe(datapoints => io.emit("datapoint", datapoints))
}
