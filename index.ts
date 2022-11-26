import fs from 'fs'
import { sslCheck } from './libs/ssl'

async function runSSL() {
    const fsRead = fs.readFileSync('./settings/ssl.conf', 'utf8')
    const urls = fsRead.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.startsWith('#'))
        .map(line => line.replace('https://', ''))
        .map(line => (line.slice(-1) != "/") ? line : line.slice(0, -1))

    const mode = fsRead.split('\n')
        .filter(line => line.startsWith('# MODE:'))[0]
        .split(':')[1]

    const logging = fsRead.split('\n')
        .filter(line => line.startsWith('# LOGGING:'))[0]
        .split(':')[1]

    if (mode != 'raw' && mode != 'parsed') throw new Error('Invalid mode')

    const res = await sslCheck(urls, mode, (logging == 'true'))
    return (mode == 'raw') ? console.log(res) : console.table(res)
}

runSSL()
