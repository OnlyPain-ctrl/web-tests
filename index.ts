import fs from 'fs'
import { sslCheck } from './libs/ssl'

async function runSSL() {
    const fsRead = fs.readFileSync('ssl.settings', 'utf8')
    const urls = fsRead.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)
        .filter(url => !url.startsWith('#'))
        .map(url => url.replace('https://', ''))
        .map(url => (url.slice(-1) != "/") ? url : url.slice(0, -1))

    const mode = urls[0].split(':')[1].trim()
    if (mode != 'raw' && mode != 'parsed') throw new Error('Invalid mode')

    urls.shift()

    const res = await sslCheck(urls, mode)
    return (mode == 'raw') ? console.log(res) : console.table(res)
}

runSSL()
