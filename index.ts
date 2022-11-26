import fs from 'fs'
import { sslCheck } from './libs/ssl'

async function runSSL() {
    const fsRead = fs.readFileSync('./settings/ssl.conf', 'utf8')
    const urls = fsRead.split('\n')
        .filter(line => line.length > 0)
        .filter(line => !line.startsWith('#'))
        .map(line => line.trim())
        .map(line => line.replace('https://', ''))
        .map(line => (line.slice(-1) != "/") ? line : line.slice(0, -1))

    const mode = fsRead.split('\n')
        .filter(line => line.startsWith('# MODE:'))[0]
        .split(':')[1]
        .trim()

    const logging = fsRead.split('\n')
        .filter(line => line.startsWith('# LOGGING:'))[0]
        .split(':')[1]
        .trim()

    if (logging != 'true' && logging != 'false') throw new Error('Invalid logging mode (true | false)')
    if (mode != 'json' && mode != 'table') throw new Error('Invalid mode (json | table)')

    const res = await sslCheck(urls, mode, (logging == 'true'))
    return (mode == 'json') ? console.log(res) : console.table(res)
}

runSSL()
