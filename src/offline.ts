import fs from 'fs'
import scrape from 'website-scraper'
import { dateHelper, fileParseHelper } from './libs/configHelpers'

/* exports */

export async function runOffline() {
    const conf = await getConfig()

    conf.source.forEach((source, index) => {
        if (!source) return

        const whitelist = conf.whitelist[index]

        const day = dateHelper.dayString()
        const time = dateHelper.timeString

        runDwonload(
            source,
            whitelist,
            conf.concurrency,
            './_offline_version/' + day + '/' + time
        )
    })
}

/* helpers */

async function getConfig() {
    const fsRead = fs.readFileSync('./settings/offline.conf', 'utf8')

    const urls = fsRead
        .replaceAll('\n', '')
        .split('---')
        .filter((e) => !!e)
        .map((line) => {
            return line
                .split('*')
                .filter((line) => line.length > 0)
                .filter((line) => !line.startsWith('_'))
                .filter((line) => !line.startsWith('#'))
                .map((line) => line.trim())
        })

    const concurrency = fileParseHelper.getSettingValueAsInt(
        fsRead,
        'concurrency'
    )

    const source = urls.map((ar) => ar[0])
    const whitelist = urls

    return { source, whitelist, concurrency }
}

async function runDwonload(
    source: string,
    whitelist: Array<string>,
    concurrency: number,
    directory: string
) {
    const options = {
        urls: [source],
        directory: directory,
        request: {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19',
            },
        },
        urlFilter: (url: string) =>
            whitelist.some((i: string) => url.includes(i)),
        recursive: true,
        requestConcurrency: concurrency,
        filenameGenerator: 'bySiteStructure',
    }

    await scrape(options)
}
