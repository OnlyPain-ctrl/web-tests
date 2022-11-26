import { runSSL } from './libs/ssl'

switch (process.argv[2]) {
    case 'ssl':
        runSSL()
        break

    default:
        throw new Error('Not a valid argument')
}
