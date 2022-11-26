import fs from 'fs'
import sslChecker from "ssl-checker"

export async function sslCheck(data: Array<string>, mode: "raw" | "parsed" = 'raw', logging = false) {
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
            .then(obj => { return { ...{ error: false, sourceUrl: url }, ...obj } })
            .catch(() => { return { sourceUrl: url, error: true } })
    })

    const res = await Promise.all(promise);

    if (logging) {
        /* TODO: valid json missing: "[]" */
        const jsonRes = new Uint8Array(Buffer.from(JSON.stringify({ ...{ "timestamp": new Date() }, ...res }) + ",\n"))
        if (!fs.existsSync("logs")) fs.mkdirSync("logs")
        fs.appendFileSync('./logs/ssl.json', jsonRes)
    }

    if (mode == 'raw') return res

    return res.sort((a, b) => {
        if (a.daysRemaining && b.daysRemaining) return b.daysRemaining - a.daysRemaining
        else return Number(a.error) - Number(b.error)
    }).map(obj => [obj.sourceUrl, obj.error, obj.valid, obj.daysRemaining])
}
