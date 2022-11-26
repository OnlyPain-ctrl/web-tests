import { runSSL } from './libs/ssl'
import { runCrawler } from './libs/crawler'

switch (process.argv[2]) {
    case 'ssl':
        runSSL()
        break
    case 'crawl':
        runCrawler()
        break

    default:
        throw new Error('Not a valid argument')
}
