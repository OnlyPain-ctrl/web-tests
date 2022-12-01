import fs from 'fs'
import sslChecker from 'ssl-checker'
import { askQuestion } from './libs/cli'
import { dateHelper, fileParseHelper } from './libs/configHelpers'

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
    const urls = fileParseHelper
        .splitNewLineRmComments(fsRead)
        .map((line) => line.replace('https://', ''))
        .map((line) => (line.slice(-1) != '/' ? line : line.slice(0, -1)))

    const mode = fileParseHelper.getSettingValue(fsRead, 'mode')
    const logging = fileParseHelper.getSettingValue(fsRead, 'logging')

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
        if (!fs.existsSync('_logs')) fs.mkdirSync('_logs')

        try {
            const fsRead = fs.readFileSync('./_logs/ssl.json', 'utf8')
            const jsonData = JSON.parse(fsRead)
            writeLog(jsonData)
        } catch (error) {
            const answer = await askQuestion(
                '\nCurrent log file is empty / invalid. \nWould you like to create new one / override old one? \n(y/n) '
            )
            if (answer == 'y' || answer == 'Y') writeLog({})
        }

        function writeLog(data: { [key: string]: unknown }) {
            data[dateHelper.timestampString()] = res
            fs.writeFileSync('./_logs/ssl.json', JSON.stringify(data), 'utf8')
        }
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
