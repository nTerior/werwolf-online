import e from "express"
import { Screen } from "../screen"
import { State } from "../state"

var player_list = document.createElement("div")

export function createWaitRoom(): Screen {

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

    var gameLink = document.createElement("input")
    gameLink.classList.add("link")
    gameLink.value = State.game?.getLink()!
    gameLink.onkeydown = (ev) => {
        return false
    }
    gameLink.onclick = () => {
        // Copy
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
    players.forEach(player => {
        var el = document.createElement("div")
        el.classList.add("wait-room-player-list-player")
        el.textContent = player
        player_list.appendChild(el)
    });
}
