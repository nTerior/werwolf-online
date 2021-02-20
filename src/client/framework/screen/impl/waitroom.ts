import { Packet } from "../../../../packet"
import { Player } from "../../../game/player"
import { State } from "../../../state"
import { Message } from "../../message"
import { createHeader, createText } from "../../text"
import { Screen } from "../screen"

export async function generateWaitRoomScreen(): Promise<Screen> {
    var div = document.createElement("div")

    div.appendChild(createHeader("h2", "Warteraum"))
    div.appendChild(createText("Du spielst gleich eine Runde Werwolf. Zu Beginn wird dir deine Rolle gezeigt und du erhälst eine Beschreibung der Rolle die du spielst. Um eine Aktion auszuführen, wenn du dran bist, mussst du auf den Spieler klicken, bei dem du diese Aktion ausführen willst."))

    div.appendChild(await createUserList())

    return {
        element: div,
        title: "Warteraum"
    }
}

async function createUserList(): Promise<HTMLDivElement> {

    var list: {name: string, id: string}[] = (await State.ws.sendAndRecvPacket(new Packet("get-player-list", State.game.id))).data
    list.forEach(e => {
        State.game.players.push(new Player(e.name, e.id))
    })

    var div = document.createElement("div")
    div.classList.add("user-list")
    State.game.players.forEach(player => {
        div.appendChild(createUser(player.name, player.id))
    })

    State.ws.setOnPacket("player-joined", packet => {
        var player: Player = new Player(packet.data.name, packet.data.id)
        State.game.players.push(player)
        new Message(player.name + " ist dem Spiel beigetreten").display()
        div.appendChild(createUser(player.name, player.id))
    })
    State.ws.setOnPacket("player-left", async packet => {
        div.removeChild(document.getElementById("user-element-" + packet.data.id)!)
        var index = State.game.players.findIndex(e => e.id == packet.data.id)
        new Message(State.game.players[index].name + " hat das Spiel verlassen").display()
        State.game.players.splice(index, 1)
        State.game.self_is_owner = (await State.ws.sendAndRecvPacket(new Packet("is_owner", State.game.id))).data
    })
    return div
}

function createUser(username: string, id: string): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("user-element")
    div.id = "user-element-" + id

    var img = document.createElement("img")
    img.src = "/static/assets/user.png"
    img.alt = "user.png"
    div.appendChild(img)

    var name = document.createElement("div")
    name.classList.add("user-name")
    name.textContent = username
    div.appendChild(name)

    return div
}
