import { Role } from "../../role"
import { Game } from "../game/game"
import { popScreen, Screen, setScreen } from "../screen"
import { State } from "../state"
import { get_game_id } from "../util"
import { createWaitRoom } from "./screenWaitRoom"

export function generateMainScreen(): Screen {
    var div = document.createElement("div")
    div.id = "main-screen"
    
    var header = document.createElement("h1")
    header.textContent = "Werwölfe"
    div.appendChild(header)

    var name = document.createElement("input")
    name.id = "name"
    name.placeholder = "Dein Name (dieses Feld muss ausgefüllt werden)"
    name.onkeydown = (ev) => {
        if(ev.key === "Enter") {
            if(get_game_id()) joinGameButton()
            else createGameButton()
        }
    }
    div.appendChild(name)

    div.appendChild(document.createElement("br"))

    var join_button = document.createElement("button")
    join_button.textContent = "Spiel beitreten"
    join_button.onclick = joinGameButton
    if(get_game_id()) div.appendChild(join_button)

    var create_button = document.createElement("button")
    create_button.textContent = "Spiel erstellen"
    create_button.onclick = createGameButton
    div.appendChild(create_button)

    return {
        element: div,
        title: "Werwölfe"
    }
}

function begin() {
    var name = <HTMLInputElement>document.getElementById("name")
    if(!name.value) return false
    State.ws.setName(name.value)
    return true
}

async function nextScreen() {
    popScreen()
    setScreen(await createWaitRoom())
}

async function createGameButton() {
    if(!begin()) return
    State.game = await createGame()
    joinGame(State.game.id)
    await nextScreen()
}

async function joinGameButton() {
    if(!begin()) return
    var temp = await joinGame(get_game_id()!)
    if(temp != undefined) {
        State.game = <Game>temp
        await nextScreen()
    } else {
        alert("Dieses Spiel existiert nicht!")
    }
}

async function createGame(): Promise<Game> {
    var game: Game = new Game(await State.ws.createGame(), {name: await State.ws.getName()})
    return game
}

async function joinGame(id:string) {
    if(await State.ws.joinGame(id) == undefined) return undefined
    var game: Game = new Game(id, {name: await State.ws.getName()})
    return game
}
