import { RoleName } from "../../role"
import { Screen, setScreen } from "../screen"
import { State } from "../state"
import { createGameScreen } from "./gameScreen"

var player_list = document.createElement("div")

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
    State.ws.on("start-game", async () => {
        setScreen(createGameScreen())
    })

    var role_settings = document.createElement("div")
    role_settings.classList.add("role-settings")
    var h = document.createElement("h2")
    h.textContent = "Rollen"
    role_settings.appendChild(h)
    for(var name in RoleName) {
        var el = document.createElement("div")
        var rolename = document.createElement("div")
        rolename.classList.add("role-settings-value")
        //@ts-expect-error
        rolename.textContent = RoleName[name]
        el.appendChild(rolename)

        var rolecount = document.createElement("input")
        rolecount.classList.add("rolecount", "role-settings-value")
        rolecount.id = "role-amount-" + name
        rolecount.value = "0";
        rolecount.type = "number"

        el.appendChild(rolecount)

        role_settings.appendChild(el)
    }
    if(await State.ws.isMod(State.game.id)) div.appendChild(role_settings)

    var playButtonDiv = document.createElement("div")
    if(await State.ws.isMod(State.game.id)) {
        var playButton = document.createElement("button")
        playButton.textContent = "Spiel starten"
        playButton.onclick = () => {
            var amounts: {role:RoleName, amount:number}[] = []
            for(name in RoleName) {
                amounts.push({
                    //@ts-expect-error
                    role: name,
                    amount: +(<HTMLInputElement>document.getElementById("role-amount-" + name)).value
                })
            }
            State.ws.startGame(State.game.id, amounts)
        }
        playButtonDiv.appendChild(playButton)
    }
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
        }, 2500)
    }
    div.appendChild(gameLink)

    return {
        element: div,
        title: "Werwölfe | Warteraum"
    }
}

async function updatePlayerList() {
    player_list.innerHTML = ""
    await State.game.updatePlayers()
    console.log(State.game.players.length)

    var header = document.createElement("h2")
    header.classList.add("wait-room-player-list-header")
    header.textContent = "Spieler: (" + State.game.players.length + ")"
    player_list.appendChild(header)
    
    State.game.players.forEach(async player =>  {
        var el = document.createElement("div")
        el.classList.add("wait-room-player-list-player")

        var name = document.createElement("div")
        name.textContent = player.name
        el.appendChild(name)

        player_list.appendChild(el)
    });
}
