import { Packet } from "../../packet"
import { State } from "../state"
import { createButton } from "./button"
import { createInputField } from "./input"
import { createDivText, createHeader } from "./text"

try {
    if(document != undefined) {
        var chat_div = document.createElement("div")
        var chat_content = document.createElement("div")
    }
} catch (ReferenceError) { }

export function createChat(): HTMLDivElement {
    chat_div.classList.add("chat")
    chat_div.appendChild(createChatField())
    chat_div.appendChild(createBottomField())

    addChatMessage("Werwölfe", "Dies ist euer persönliche Chat. Hier könnt ihr mit den anderen Werwölfen kommunizieren und euch auf ein Ziel absprechen. Dazu könnt ihr einfach die Nachricht eingeben und auf senden drücken, bzw. die Entertaste drücken. Aber Achtung: Das/Die Mädchen können auch mit dem Chat interagieren.")
    return chat_div
}

function createBottomField(): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("chat-bottom-field")
    var text = createInputField("Nachricht", "", () => sendMessage(text), "", [], "chat-input-field")
    div.appendChild(text)
    div.appendChild(createButton("Senden", () => sendMessage(text), "chat-send-btn"))

    return div
}

function createChatField(): HTMLDivElement {
    chat_content.classList.add("chat-content")
    State.ws.setOnPacket("recv-chat-message", packet => {
        addChatMessage(packet.data.author, packet.data.content)
        chat_content.scrollTop = chat_content.scrollHeight
    })
    return chat_content
}

function createChatMessage(author: string, content: string, timestamp: string): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("chat-message")

    var name: string = State.game.getSelfPlayer().name
    if(author == name.substring(0, name.length - 5)) div.classList.add("own-chat-message")

    div.appendChild(createHeader("h4", author, "chat-message-author", "chat-message-content"))
    div.appendChild(createDivText(content, "chat-message-text", "chat-message-content"))
    div.appendChild(createHeader("h5", timestamp, "chat-message-timestamp", "chat-message-content"))

    return div
}

export function addChatMessage(author: string, content: string) {
    var timestamp = new Date().toLocaleString("de-DE", { hour: "numeric", minute: "numeric", second: "numeric" })
    chat_content.appendChild(createChatMessage(author, content, timestamp))
}

function sendMessage(text_field: HTMLInputElement) {
    if(text_field.value.trim() == "") return
    var name: string = State.game.getSelfPlayer().name
    State.ws.sendPacket(new Packet("chat-msg-sent", {game_id: State.game.id, author: name.substring(0, name.length - 5), content: text_field.value}))
    text_field.value = ""
}
