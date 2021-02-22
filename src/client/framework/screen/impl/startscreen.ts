import { Packet } from "../../../../packet"
import { Game } from "../../../game/game"
import { State } from "../../../state"
import { createButton } from "../../button"
import { addBreak } from "../../framework"
import { createInputField } from "../../input"
import { Message, Urgency } from "../../message"
import { createHeader } from "../../text"
import { get_game_id } from "../../urlutils"
import { nextScreen, Screen } from "../screen"
import { generateWaitRoomScreen } from "./waitroom"

export function generateStartScreen(): Screen {
    var div = document.createElement("div")

    div.appendChild(createHeader("h1", "Werwölfe"))
    var name = createInputField("Name", "", async () => {
        if(get_game_id()) await joinGameButton()
        else await createGameButton()
    }, "name-field", [])
    setTimeout(() => name.focus(), 100)
    div.appendChild(name)

    addBreak(div)
    if(get_game_id()) div.appendChild(createButton("Spiel beitreten", async () => await joinGameButton(), "btn-inline"))
    div.appendChild(createButton("Spiel erstellen", async () => await createGameButton(), "btn-inline"))

    var copyright = document.createElement("div")
    copyright.id = "copyright"
    copyright.textContent = "Code by Paul Stier, Images by Siri Bürkle"
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
    var v = checkUsername()
    if(!v) return
    joinGame(v, get_game_id()!)
}

async function createGameButton() {
    var v = checkUsername()
    if(!v) return
    await createGame(v)
}


async function createGame(name: string) {
    var id: string = (await State.ws.sendAndRecvPacket(new Packet("create-game"))).data
    new Message("Du hast das Spiel ID \"" + id + "\" erstellt").display()
    await joinGame(name, id)
}

async function joinGame(name: string, game_id: string) {
    var result: string = (await State.ws.sendAndRecvPacket(new Packet("join-game", {name: name, game_id: game_id}))).data
    if(result == "success") {
        new Message("Du bist dem Spiel \"" + game_id + "\" beigetreten").display()
        State.game = new Game(game_id)
        State.game.self_is_owner = (await State.ws.sendAndRecvPacket(new Packet("is_owner", State.game.id))).data
        nextScreen(await generateWaitRoomScreen())
    } else {
        new Message(result, 5000, Urgency.ERROR).display()
    }
}
