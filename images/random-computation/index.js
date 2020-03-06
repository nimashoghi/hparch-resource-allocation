const TIMELINE_FILE = "/timeline.json"
const START_FILE = "/start"

// const TIMELINE_FILE = "../../shared/timelines/sign-timeline.json"
// const START_FILE = "../../shared/start.txt"

const {timeline} = require(TIMELINE_FILE)
const fs = require("fs").promises

const randMatrix = () =>
    Array.from(Array(100)).map(() =>
        Array.from(Array(100)).map(() => Math.random()),
    )

const matrixMultiply = (a, b) => {
    const bCols = transpose(b)
    return a.map(aRow => bCols.map(bCol => dotProduct(aRow, bCol)))
}

function randomComputation() {
    let finalMatrix
    for (let i = 0; i < 20; i++) {
        const [a, b] = [randMatrix(), randMatrix()]
        finalMatrix = finalMatrix
            ? matrixMultiply(matrixMultiply(a, b), finalMatrix)
            : matrixMultiply(a, b)
    }

    return finalMatrix
}

// dotProduct :: Num a => [[a]] -> [[a]] -> [[a]]
const dotProduct = (xs, ys) => sum(zipWith(product, xs, ys))

// GENERIC

// zipWith :: (a -> b -> c) -> [a] -> [b] -> [c]
const zipWith = (f, xs, ys) =>
    xs.length === ys.length ? xs.map((x, i) => f(x, ys[i])) : undefined

// transpose :: [[a]] -> [[a]]
const transpose = xs => xs[0].map((_, iCol) => xs.map(row => row[iCol]))

// sum :: (Num a) => [a] -> a
const sum = xs => xs.reduce((a, x) => a + x, 0)

// product :: Num a => a -> a -> a
const product = (a, b) => a * b

const sleep = interval =>
    new Promise(resolve => {
        setTimeout(() => resolve(), interval)
    })

const waitForStart = async () => {
    while (true) {
        if ((await fs.readFile(START_FILE)).toString().trim() === "1") {
            return
        }
        await sleep(100)
    }
}

const main = async () => {
    await waitForStart()

    let [lastTimestamp, lastTimestampTimeline] = [Date.now(), 0]
    for (const {timestamp} of timeline) {
        const durationDiff =
            Date.now() -
            lastTimestamp -
            (lastTimestampTimeline - timestamp) * 1000
        if (durationDiff > 0) {
            await sleep(durationDiff)
        }

        const startTimestamp = Date.now()
        randomComputation()

        lastTimestamp = Date.now()

        const duration = (lastTimestamp - startTimestamp) / 1000
        const timelineDuration = timestamp - lastTimestampTimeline

        lastTimestampTimeline = timestamp

        console.log(
            `${timestamp}: took ${duration}s but should have taken ${timelineDuration}s`,
        )
    }
}
main().catch(console.error)
