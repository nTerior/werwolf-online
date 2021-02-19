import { get_root } from "./framework"

interface MessageBuild {
    message: Message,
    element: HTMLElement
}

export enum Urgency {
    NORMAL = "urgency-normal",
    WARNING = "urgency-warning",
    ERROR = "urgency-error"
}

const message_stack: MessageBuild[] = []

function pushMessage(message: Message) {
    message_stack.forEach(m => {
        var current = parseInt(m.element.style.bottom.replace(/[^0-9]/g, ""))
        if(current.toString() == "NaN") current = 2
        current += 5
        m.element.style.bottom = current + "em"
    })
    
    var build = buildMessage(message)
    message_stack.push(build)
    get_root().appendChild(build.element)
    if(message.time > 0) setTimeout(() => removeMessage(build), message.time)
}

function removeMessage(message: MessageBuild) {
    message.element.classList.remove("message-active")
    message.element.classList.add("message-inactive")

    var index = message_stack.findIndex(e => e === message)
    message_stack.splice(index, 1)
    message_stack.slice(0, index).forEach(m => {
        var current = parseInt(m.element.style.bottom.replace(/[^0-9]/g, ""))
        if(current.toString() == "NaN") current = 2
        current -= 5
        m.element.style.bottom = current + "em"
    })

    setTimeout(() => {
        try {
            get_root().removeChild(message.element)
        } catch {}
    }, 1000)
}

function buildMessage(message: Message): MessageBuild {
    var div = document.createElement("div")
    div.classList.add("message", "message-active")
    
    div.onclick = () => {
        var v = message_stack.find(e => e.element === div)
        if (v) removeMessage(v)
    }

    var color = document.createElement("div")
    color.classList.add("message-urgency", message.urgency)
    div.appendChild(color)

    var text = document.createElement("div")
    text.classList.add("message-content")
    text.textContent = message.text
    div.appendChild(text)

    return {
        message: message,
        element: div
    }
}

export class Message {
    public text: string
    public urgency: Urgency
    public time: number
    
    constructor(text: string, time: number = 5000, urgency: Urgency = Urgency.NORMAL) {
        this.text = text
        this.urgency = urgency
        this.time = time
    }

    public display() {
        pushMessage(this)
    }
}
