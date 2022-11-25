import sslChecker from "ssl-checker"

export async function sslCheck(data: Array<string>, mode: "raw" | "parsed" = 'raw') {
    type resType = Promise<{
        error: boolean
        sourceUrl: string
        valid?: boolean
        validFrom?: string
        validTo?: string
        daysRemaining?: number
        validFor?: string[]
    }>[]

    const urls = [...new Set(data)]

    const promise: resType = urls.map(async (url) => {
        return await sslChecker(url, { method: "GET", port: 443 })
            .then((obj) => { return { ...{ error: false, sourceUrl: url }, ...obj } })
            .catch(() => { return { sourceUrl: url, error: true } })
    })

    const res = await Promise.all(promise)
    if (mode === 'raw') return res

    const resParsed = res.sort((a, b) => {
        if (a.daysRemaining && b.daysRemaining) {
            return a.daysRemaining - b.daysRemaining
        } else {
            return Number(a.error) - Number(b.error)
        }
    }).map((obj) => {
        return [obj.sourceUrl, obj.error, obj.valid, obj.daysRemaining]
    })

    return resParsed
}
