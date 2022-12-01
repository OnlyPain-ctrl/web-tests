import fs from 'fs'
import scrape from 'website-scraper'

/* exports */

export async function runOffline() {
    const conf = await getConfig()

    conf.source.forEach((source, index) => {
        if (!source) return

        const whitelist = conf.whitelist[index]

        const date = new Date()

        const day =
            date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear()
        const time =
            date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds()

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
                .filter((line) => !line.startsWith('#'))
                .map((line) => line.trim())
        })

    const concurrency = parseInt(
        fsRead
            .split('\n')
            .filter((line) => line.includes('CONCURRENCY:'))[0]
            .split(':')[1]
            .trim()
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
        urlFilter: (url: string) => {
            return whitelist.some((i: string) => url.includes(i))
        },
        recursive: true,
        requestConcurrency: concurrency,
        filenameGenerator: 'bySiteStructure',
    }

    await scrape(options)
}
