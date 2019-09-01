export const toObject = <ArrayElement, Object extends object>(
    array: ArrayElement[],
    selector: (
        element: ArrayElement,
    ) => readonly [keyof Object, Object[keyof Object]],
): Object =>
    array.reduce(
        (prev, curr) => {
            const [key, value] = selector(curr)
            return {...prev, [key]: value}
        },
        {} as Object,
    )

export const mapAsync = async <Input, Output>(
    input: Input[],
    f: (value: Input, index: number, array: Input[]) => Promise<Output>,
): Promise<Output[]> => await Promise.all(input.map(f))

export const mapOptionAsync = async <Input, Output>(
    input: Input[],
    f: (
        value: Input,
        index: number,
        array: Input[],
    ) => Promise<Output | undefined>,
): Promise<Output[]> =>
    (await Promise.all(input.map(f)))
        .filter(value => !!value)
        .map(value => value!)

export const filterAsync = async <Input>(
    input: Input[],
    f: (value: Input, index: number, array: Input[]) => Promise<boolean>,
): Promise<Input[]> =>
    (await Promise.all(
        input.map(async (...args) => [args[0], await f(...args)] as const),
    ))
        .filter(([, status]) => status)
        .map(([value]) => value)

export const foreachAsync = async <Input, Output>(
    input: Input[],
    f: (value: Input) => Promise<Output>,
): Promise<void> => {
    await Promise.all(input.map(value => f(value)))
}

export type Vec3 = [number, number, number]
export const distance = (lhs: Vec3, rhs: Vec3) =>
    Math.sqrt(
        (lhs[0] - rhs[0]) ** 2 +
            (lhs[1] - rhs[1]) ** 2 +
            (lhs[2] - rhs[2]) ** 2,
    )
