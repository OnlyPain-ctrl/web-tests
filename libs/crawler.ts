import fs from 'fs'
import { LinkChecker } from 'linkinator'

/* exports */

export async function runCrawler() {
    const conf = await getConfig()
    console.log(conf)

    crawlerCheck(conf.urls, conf.concurrency)
}

/* helpers */

async function getConfig() {
    const fsRead = fs.readFileSync('./settings/crawl.conf', 'utf8')

    const urls = fsRead
        .split('\n')
        .filter((line) => line.length > 0)
        .filter((line) => !line.startsWith('#'))
        .map((line) => line.trim())

    const concurrency = parseInt(
        fsRead
            .split('\n')
            .filter((line) => line.includes('CONCURRENCY:'))[0]
            .split(':')[1]
            .trim()
    )

    if (!concurrency)
        throw new Error('Invalid value for concurrency (1, 50, 100)')

    return { urls, concurrency }
}

async function crawlerCheck(urls: Array<string>, concurrency = 100) {
    const date = new Date()

    const day =
        date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear()
    const time =
        date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds()

    const folder = './logs/crawl_' + day + '/time_' + time + '/'

    fs.mkdirSync(folder, { recursive: true })

    urls.forEach(async (url) => {
        const linkChecker = new LinkChecker()

        linkChecker.on('link', (result) => {
            console.log(`${result.status} | ${result.url}`)

            const reqPath = result.url.includes('base64')
                ? 'base64(skipped)'
                : result.url
            const full = `${result.state}|${result.status}|${reqPath}|${result.parent}`
            const fullU8 = new Uint8Array(Buffer.from(full + '\n'))

            const name = url
                .replaceAll('/', '')
                .replaceAll(':', '')
                .replaceAll('https', '')
                .replaceAll('http', '')
                .replaceAll('www.', '')
                .replaceAll('.', '-')

            const first = result.status?.toString()[0]
            const statusPath = folder + '/' + name + '_[' + first + 'xx].csv'
            const path = folder + '/' + name + '_[full]' + '.csv'

            fs.appendFileSync(statusPath, fullU8)
            fs.appendFileSync(path, fullU8)
        })

        await linkChecker.check({
            path: url,
            concurrency: concurrency,
            recurse: true,
        })
    })
}
