import {promises as fs} from "fs"

const groupBy = <T>(list: T[], key: (value: T) => string) =>
    Object.values(
        list.reduce((grouped, curr) => {
            const prevKey = key(curr)
            const prev = grouped[prevKey]

            return {...grouped, [prevKey]: [...(prev ?? []), curr]}
        }, {} as Record<string, T[]>),
    )

const main = async () => {
    const data = (await fs.readFile("./plot-data.txt"))
        .toString()
        .split("\n")
        .map(line => line.trim())
        .filter(line => !!line)
        .map(line => JSON.parse(line))

    const grouped = groupBy(data, ({chartName}) => chartName)
    for (const group of grouped) {
        const fileName = group[0].chartName.replace(/ /g, "-")
        await fs.writeFile(
            `./csv/${fileName}.csv`,
            group
                // @ts-ignore
                .flatMap(({name, values}) =>
                    // @ts-ignore
                    values.map(values => [name, ...values].join(",")),
                )
                .join("\n"),
        )
    }
}

main().catch(console.error)
