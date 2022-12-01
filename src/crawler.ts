import fs from 'fs'
import { LinkChecker } from 'linkinator'
import { dateHelper, fileParseHelper } from './libs/configHelpers'

/* exports */

export async function runCrawler() {
    const conf = await getConfig()
    const res = await crawlerCheck(
        conf.urls,
        conf.concurrency,
        conf.fullLog == 'true'
    )

    const newPath = res.path.replace('_unfinished', '')
    fs.renameSync(res.path, newPath)

    console.log('---')
    console.log('urls checked: ' + res.urls.length)
    console.log('log path: ' + newPath)
}

/* helpers */

async function getConfig() {
    const fsRead = fs.readFileSync('./settings/crawl.conf', 'utf8')

    const urls = fileParseHelper.splitNewLineRmComments(fsRead)

    const concurrency = fileParseHelper.getSettingValueAsInt(
        fsRead,
        'concurrency'
    )

    const fullLog = fileParseHelper.getSettingValue(fsRead, 'full')

    if (!concurrency)
        throw new Error('Invalid value for concurrency (1, 50, 100)')

    return { urls, concurrency, fullLog }
}

async function crawlerCheck(
    urls: Array<string>,
    concurrency = 100,
    fullLog = false
) {
    const day = dateHelper.dayString()
    const time = dateHelper.timeString()

    const folder = './logs/crawler/' + day + '/' + time + '_unfinished/'

    fs.mkdirSync(folder, { recursive: true })

    const promise = urls.map(async (url) => {
        const linkChecker = new LinkChecker()

        linkChecker.on('link', (result) => {
            console.log(`${result.status} | ${result.url}`)

            const reqPath =
                result.url.includes('base64') && result.url.includes('data:')
                    ? 'base64(skipped)'
                    : result.url
            const full = `${result.state}|${result.status}|${reqPath}|${result.parent}`
            const fullU8 = new Uint8Array(Buffer.from(full + '\n'))

            const name = fileParseHelper.urlToFilename(url)
            const first = result.status?.toString()[0]

            const statusPath = folder + '/' + name + '_[' + first + 'xx].csv'
            const path = folder + '/' + name + '_[full]' + '.csv'

            if (result.status != 200) {
                fs.appendFileSync(
                    folder + '/_all_[' + first + 'xx].csv',
                    fullU8
                )
            }

            fs.appendFileSync(statusPath, fullU8)
            if (fullLog) fs.appendFileSync(path, fullU8)
        })

        return await linkChecker.check({
            path: url,
            concurrency: concurrency,
            recurse: true,
            retry: true,
            retryErrors: true,
            retryErrorsCount: 2,
            retryErrorsJitter: 2,
            timeout: 60000 * 3,
        })
    })

    return { ...{ path: folder }, ...{ urls: await Promise.all(promise) } }
}
