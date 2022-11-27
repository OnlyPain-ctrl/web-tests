import fs from 'fs'
import sslChecker from 'ssl-checker'

/* exports */

export async function runSSL() {
    const conf = await getConfig()

    if (conf.logging != 'true' && conf.logging != 'false')
        throw new Error('Invalid logging mode (true | false)')
    if (conf.mode != 'json' && conf.mode != 'table')
        throw new Error('Invalid mode (json | table)')

    const res = await sslCheck(conf.urls, conf.mode, conf.logging == 'true')

    console.log('---')

    return conf.mode == 'json' ? console.log(res) : console.table(res)
}

/* helpers */

async function getConfig() {
    const fsRead = fs.readFileSync('./settings/ssl.conf', 'utf8')
    const urls = fsRead
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => !line.startsWith('#'))
        .map((line) => line.replace('https://', ''))
        .map((line) => (line.slice(-1) != '/' ? line : line.slice(0, -1)))

    const mode = fsRead
        .split('\n')
        .filter((line) => line.includes('MODE:'))[0]
        .split(':')[1]
        .trim()

    const logging = fsRead
        .split('\n')
        .filter((line) => line.includes('LOGGING:'))[0]
        .split(':')[1]
        .trim()

    return { urls, mode, logging }
}

async function sslCheck(
    data: Array<string>,
    mode: 'json' | 'table' = 'json',
    logging = false
) {
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
        return await sslChecker(url, { method: 'GET', port: 443 })
            .then((obj) => {
                console.log('[y]', url)
                return { ...{ error: false, sourceUrl: url }, ...obj }
            })
            .catch(() => {
                console.log('[n]', url)
                return { sourceUrl: url, error: true }
            })
    })

    const res = await Promise.all(promise)

    if (logging) {
        /* TODO: valid json missing: '[]' */
        const jsonRes = new Uint8Array(
            Buffer.from(
                JSON.stringify({ ...{ timestamp: new Date() }, ...res }) + ',\n'
            )
        )
        if (!fs.existsSync('logs')) fs.mkdirSync('logs')
        fs.appendFileSync('./logs/ssl.json', jsonRes)
    }

    if (mode == 'json') return res

    return res
        .sort((a, b) => {
            if (a.daysRemaining && b.daysRemaining)
                return b.daysRemaining - a.daysRemaining
            else return Number(a.error) - Number(b.error)
        })
        .map((obj) => [obj.sourceUrl, obj.error, obj.valid, obj.daysRemaining])
}
