export const dateHelper = {
    newDate: new Date(),
    dayString: function () {
        return (
            this.newDate.getDate() +
            '-' +
            this.newDate.getMonth() +
            '-' +
            this.newDate.getFullYear()
        )
    },
    timeString: function () {
        return (
            this.newDate.getHours() +
            '-' +
            this.newDate.getMinutes() +
            '-' +
            this.newDate.getSeconds()
        )
    },
    timestampString: function () {
        return this.newDate.toISOString()
    },
}

export const fileParseHelper = {
    getSettingValue: function (input: string, name: string) {
        return input
            .split('\n')
            .filter((line) => line.includes(name.toUpperCase() + ':'))[0]
            .split(':')[1]
            .trim()
    },
    getSettingValueAsInt: function (input: string, name: string) {
        return parseInt(this.getSettingValue(input, name))
    },
    splitNewLineRmComments: function (input: string) {
        return input
            .split('\n')
            .filter((line) => line.length > 0)
            .filter((line) => !line.startsWith('_'))
            .filter((line) => !line.startsWith('#'))
            .map((line) => line.trim())
    },
    urlToFilename: function (url: string) {
        return url
            .replaceAll('/', '')
            .replaceAll(':', '')
            .replaceAll('https', '')
            .replaceAll('http', '')
            .replaceAll('www.', '')
            .replaceAll('.', '-')
    },
}
