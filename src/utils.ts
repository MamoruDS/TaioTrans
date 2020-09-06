export const genRandomChar = (len: number = 1): string => {
    const id = []
    for (const _ of ' '.repeat(len)) {
        id.push(
            Math.floor(Math.random() * 36)
                .toString(36)
                .toLocaleUpperCase()
        )
    }
    return id.join('')
}
