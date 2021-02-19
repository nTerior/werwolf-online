import { Packet } from "../../../../packet"
import { State } from "../../../state"
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
    div.appendChild(createInputField("Name", "", async () => {
        if(get_game_id()) await joinGameButton()
        else await createGameButton()
    }, "name-field", []))

    addBreak(div)
    if(get_game_id()) div.appendChild(createButton("Spiel beitreten", async () => await joinGameButton(), "btn-inline"))
    div.appendChild(createButton("Spiel erstellen", async () => await createGameButton(), "btn-inline"))

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

async function joinGameButton() {
    if(!checkUsername()) return
    joinGame(checkUsername()!, get_game_id()!)
}

async function createGameButton() {
    if(!checkUsername()) return
    await createGame()
}


async function createGame() {
    var id: string = (await State.ws.sendAndRecvPacket(new Packet("create-game"))).data
    new Message("Du hast das Spiel ID \"" + id + "\" erstellt").display()
    await joinGame(checkUsername()!, id)
}

async function joinGame(name: string, game_id: string) {
    var result: string = (await State.ws.sendAndRecvPacket(new Packet("join-game", {name: name, game_id: game_id}))).data
    if(result == "success") {
        new Message("Du bist dem Spiel \"" + game_id + "\" beigetreten").display()
    } else {
        new Message(result, 5000, Urgency.ERROR).display()
    }
}
