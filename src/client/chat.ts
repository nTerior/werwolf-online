import { State } from "./state"

export function createChatWindow():HTMLElement {
    var div = document.createElement("div")
    div.id = "chat-window"

    var chat = document.createElement("div")
    chat.classList.add("chat-history")
    State.ws.on("chat-message", (data) => {
        if(data["message"] == undefined) return
        var content = document.createElement("div")

        var name = document.createElement("span")
        name.classList.add("chat-sender")
        name.textContent = data["sender"] + " » "
        content.appendChild(name)

        var message = document.createElement("span")
        message.classList.add("chat-content")
        message.textContent = data["message"].trim()
        content.appendChild(message)

        if(message.textContent != "") chat.appendChild(content)

        chat.scrollTop = chat.scrollHeight;
    })
    div.appendChild(chat)

    var message_sender = document.createElement("div")
    var message = document.createElement("input")
    message.id = "chat-message-input"
    message.placeholder = "Nachricht"
    message.onkeydown = async (ev) => {
        if(ev.key === "Enter") {
            await sendMessage(message.value)
        }
    }
    message_sender.appendChild(message)

    var send_button = document.createElement("button")
    send_button.textContent = "→"
    send_button.onclick = async () => await sendMessage(message.value)
    message_sender.appendChild(send_button)

    div.appendChild(message_sender)

    return div
}

async function sendMessage(message:string) {
    message = message.trim();
    (<HTMLInputElement>document.getElementById("chat-message-input")).value = ""
    if(message == "") return
    await State.ws.sendChatMessage(message)
}