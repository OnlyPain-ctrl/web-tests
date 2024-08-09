import fs from 'fs'
import { LinkChecker } from 'linkinator'
import { dateHelper, fileParseHelper } from './libs/configHelpers'

/* exports */

export async function runCrawler() {
    const conf = await getConfig()
    const res = await crawlerCheck(
        conf.urls,
        conf.concurrency,
        conf.fullLog == 'true',
        conf.timeout,
        conf.skipExternal == 'true',
        conf.skipFiles == 'true'
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

    const timeout = fileParseHelper.getSettingValueAsInt(fsRead, 'timeout')

    const fullLog = fileParseHelper.getSettingValue(fsRead, 'full')

    const skipExternal = fileParseHelper.getSettingValue(fsRead, 'skipExternal')

    const skipFiles = fileParseHelper.getSettingValue(fsRead, 'skipFiles')

    if (!concurrency)
        throw new Error('Invalid value for concurrency (1, 50, 100)')

    return { urls, concurrency, fullLog, timeout, skipExternal, skipFiles }
}

async function crawlerCheck(
    urls: Array<string>,
    concurrency = 100,
    fullLog = false,
    timeout: number,
    skipExternal: boolean,
    skipFiles: boolean
) {
    const day = dateHelper.dayString()
    const time = dateHelper.timeString()

    const folder = './_logs/crawler/' + day + '/' + time + '_unfinished/'

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

            if (result.status != 200 && urls.length > 1) {
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
            timeout: 60000 * timeout,
            linksToSkip: async (link) => {
                const skipIfContainer = [
                    '.3dm',
                    '.3ds',
                    '.3gp',
                    '.7z',
                    '.aac',
                    '.aae',
                    '.abk',
                    '.accdb',
                    '.ai',
                    '.aif',
                    '.ani',
                    '.apk',
                    '.app',
                    '.appx',
                    '.arc',
                    '.asc',
                    '.asf',
                    '.asp',
                    '.aspx',
                    '.avi',
                    '.bak',
                    '.bat',
                    '.bin',
                    '.blend',
                    '.bmp',
                    '.c',
                    '.cab',
                    '.cbr',
                    '.cdr',
                    '.cer',
                    '.cfg',
                    '.cfm',
                    '.class',
                    '.cmd',
                    '.com',
                    '.config',
                    '.cpl',
                    '.cpp',
                    '.crdownload',
                    '.crx',
                    '.crypt14',
                    '.cs',
                    '.csr',
                    '.css',
                    '.csv',
                    '.cur',
                    '.dae',
                    '.dat',
                    '.db',
                    '.dcm',
                    '.dds',
                    '.deb',
                    '.dem',
                    '.deskthemepack',
                    '.dgn',
                    '.djvu',
                    '.dll',
                    '.dmg',
                    '.dmp',
                    '.doc',
                    '.docx',
                    '.drv',
                    '.dwg',
                    '.dxf',
                    '.ecf',
                    '.emf',
                    '.eml',
                    '.enc',
                    '.eps',
                    '.exe',
                    '.fbx',
                    '.flac',
                    '.flv',
                    '.fnt',
                    '.gam',
                    '.gba',
                    '.gif',
                    '.gpx',
                    '.gz',
                    '.h',
                    '.heic',
                    '.html',
                    '.icns',
                    '.ico',
                    '.ics',
                    '.img',
                    '.indd',
                    '.ini',
                    '.ipa',
                    '.iso',
                    '.jar',
                    '.java',
                    '.jpeg',
                    '.jpg',
                    '.js',
                    '.json',
                    '.jsp',
                    '.key',
                    '.kml',
                    '.kmz',
                    '.kt',
                    '.lnk',
                    '.log',
                    '.lua',
                    '.m',
                    '.m3u',
                    '.m4a',
                    '.m4v',
                    '.max',
                    '.md',
                    '.mdb',
                    '.mdf',
                    '.mid',
                    '.mim',
                    '.mov',
                    '.mp3',
                    '.mp4',
                    '.mpg',
                    '.mpp',
                    '.msg',
                    '.msi',
                    '.nes',
                    '.nomedia',
                    '.numbers',
                    '.obb',
                    '.obj',
                    '.odb',
                    '.ods',
                    '.odt',
                    '.ogg',
                    '.osm',
                    '.otf',
                    '.oxps',
                    '.pages',
                    '.pak',
                    '.part',
                    '.pdb',
                    '.pdf',
                    '.php',
                    '.pkg',
                    '.pkpass',
                    '.pl',
                    '.plugin',
                    '.pmd',
                    '.png',
                    '.ppt',
                    '.pptx',
                    '.prf',
                    '.ps',
                    '.psd',
                    '.pub',
                    '.py',
                    '.qxp',
                    '.rar',
                    '.reg',
                    '.rom',
                    '.rpm',
                    '.rpt',
                    '.rtf',
                    '.run',
                    '.safariextz',
                    '.sav',
                    '.sb3',
                    '.set',
                    '.sh',
                    '.sketch',
                    '.sln',
                    '.sql',
                    '.sqlite',
                    '.srt',
                    '.step',
                    '.stl',
                    '.stp',
                    '.svg',
                    '.swf',
                    '.swift',
                    '.sys',
                    '.tar',
                    '.tar.gz',
                    '.tex',
                    '.tga',
                    '.tif',
                    '.tmp',
                    '.torrent',
                    '.ts',
                    '.ttf',
                    '.txt',
                    '.unity',
                    '.uue',
                    '.vb',
                    '.vcd',
                    '.vcf',
                    '.vcxproj',
                    '.vob',
                    '.vsdx',
                    '.vtt',
                    '.wav',
                    '.webm',
                    '.webp',
                    '.wma',
                    '.wmv',
                    '.woff',
                    '.woff2',
                    '.wpd',
                    '.xapk',
                    '.xcodeproj',
                    '.xhtml',
                    '.xlr',
                    '.xls',
                    '.xlsx',
                    '.xml',
                    '.xpi',
                    '.xps',
                    '.yml',
                    '.zip',
                    '.zipx',
                ]

                let skip = false

                if (skipExternal) {
                    if (!link.includes(url)) skip = true
                }

                if (skipFiles) {
                    skipIfContainer.forEach((container) => {
                        if (link.toLocaleLowerCase().includes(container))
                            skip = true
                    })
                }

                /* NOTE: skip url with /blog/ in it TODO: add to config
                if (link.includes('/blog/')) {
                    skip = true
                } */

                return skip
            },
        })
    })

    return { ...{ path: folder }, ...{ urls: await Promise.all(promise) } }
}
