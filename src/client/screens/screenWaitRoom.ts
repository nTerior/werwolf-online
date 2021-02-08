import e from "express"
import { Screen } from "../screen"
import { State } from "../state"

var player_list = document.createElement("div")
var playButtonDiv = document.createElement("div")

export async function createWaitRoom(): Promise<Screen> {

    updatePlayerList()

    var div = document.createElement("div")
    div.id = "main-screen"

    player_list.classList.add("wait-room-player-list")
    div.appendChild(player_list)

    State.ws.on("join", async (name) => {
        await updatePlayerList()
    })
    State.ws.on("quit", async (name) => {
        await updatePlayerList()
    })

    div.appendChild(playButtonDiv)

    var gameLink = document.createElement("input")
    gameLink.classList.add("link")
    gameLink.value = State.game?.getLink()!
    gameLink.onkeydown = (ev) => {
        return false
    }
    gameLink.onclick = () => {
        gameLink.value = State.game?.getLink()!
        gameLink.select()
        gameLink.setSelectionRange(0, 99999)
        document.execCommand("copy")
        
        var temp = gameLink.value
        gameLink.value = "Link kopiert"
        setTimeout(() => {
            gameLink.value = temp
        }, 1000)
    }

    div.appendChild(gameLink)

    return {
        element: div,
        title: "Werwölfe | Warteraum"
    }
}

async function updatePlayerList() {
    player_list.innerHTML = ""
    var players:string[] = await State.ws.getPlayers(State.game.id)
    var header = document.createElement("h2")
    header.classList.add("wait-room-player-list-header")
    header.textContent = "Spieler: (" + players.length + ")"
    player_list.appendChild(header)
    players.forEach(player => {
        var el = document.createElement("div")
        el.classList.add("wait-room-player-list-player")
        el.textContent = player
        player_list.appendChild(el)
    });

    playButtonDiv.innerHTML = ""
    if(await State.ws.isMod(State.game.id)) {
        var playButton = document.createElement("button")
        playButton.textContent = "Spiel starten"
        playButton.onclick = () => {
            alert("Jetzt würde das Spiel starten")
        }
        playButtonDiv.appendChild(playButton)
    }
}
