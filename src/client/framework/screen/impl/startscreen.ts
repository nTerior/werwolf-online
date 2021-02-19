import { createButton } from "../../button"
import { addBreak } from "../../framework"
import { createInputField } from "../../input"
import { Message, Urgency } from "../../message"
import { createHeader } from "../../text"
import { get_game_id } from "../../urlutils"
import { Screen } from "../screen"

export function generateStartScreen(): Screen {
    var div = document.createElement("div")

    div.appendChild(createHeader("h1", "Werwölfe"))
    div.appendChild(createInputField("Name", "", () => {
        if(get_game_id()) joinGameButton()
        else createGameButton()
    }, "name-field", []))

    addBreak(div)
    if(get_game_id()) div.appendChild(createButton("Spiel beitreten", () => joinGameButton(), "btn-inline"))
    div.appendChild(createButton("Spiel erstellen", () => createGameButton(), "btn-inline"))

    var copyright = document.createElement("div")
    copyright.id = "copyright"
    copyright.textContent = "by Paul Stier"
    div.appendChild(copyright)

    return {
        element: div
    }
}

function checkUsername(): string | undefined {
    var name = (<HTMLInputElement>document.getElementById("name-field")).value
    if(name) {
        if(/^[A-z0-9]*$/.test(name)) return name
        else new Message("Dein Name darf nur A-z und 0-9 enthalten!", -1, Urgency.ERROR).display()
    } else {
        new Message("Du musst deinen Namen angeben!", 5000, Urgency.ERROR).display()
    }

    return undefined
}

function joinGameButton() {
    if(!checkUsername()) return
}

function createGameButton() {
    if(!checkUsername()) return
}
