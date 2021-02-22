import { Packet } from "../../../../packet"
import { RoleName } from "../../../../role"
import { Player } from "../../../game/player"
import { State } from "../../../state"
import { createInputField } from "../../input"
import { Message } from "../../message"
import { createHeader, createText } from "../../text"
import { Screen } from "../screen"

export async function generateWaitRoomScreen(): Promise<Screen> {
    var div = document.createElement("div")

    div.appendChild(createHeader("h2", "Warteraum"))
    div.appendChild(createText("Du spielst gleich eine Runde Werwolf. Zu Beginn wird dir deine Rolle gezeigt und du erhälst eine Beschreibung der Rolle die du spielst. Um eine Aktion auszuführen, wenn du dran bist, mussst du auf den Spieler klicken, bei dem du diese Aktion ausführen willst."))

    div.appendChild(await createUserList())
    div.appendChild(createSettings())

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
        if(State.game.self_is_owner) new Message("Du bist nun der Host", 7000).display()
        updateRoleInputs()
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

function updateRoleInputs() {
    var admin = State.game.self_is_owner
    for(var role in RoleName) {
        var el = (<HTMLInputElement>document.getElementById("role-value-" + role))
        el.disabled = !admin
    }
}

function createSettings() {
    var admin = State.game.self_is_owner
    
    var div = document.createElement("div")
    div.id = "game-settings"

    for(var role in RoleName) {
        var role_name = document.createElement("div")
        role_name.classList.add("game-settings-role")
        role_name.id = "role-settings-" + role
        //@ts-expect-error
        role_name.textContent = RoleName[role]

        var role_value = document.createElement("input")
        role_value.disabled = !admin
        role_value.id = "role-value-" + role
        role_value.classList.add("game-settings-role-value")
        role_value.type = "number"
        role_value.value = "0"
        role_value.min = "0"
        role_value.onkeydown = (ev) => {
            if (!ev.code.startsWith("Digit") && !ev.code.startsWith("Numpad") && !ev.code.startsWith("Backspace") && !ev.code.startsWith("Arrow")) {
                ev.preventDefault()
            }
        }

        role_name.appendChild(role_value)
        div.appendChild(role_name)
    }
    
    var link_div = document.createElement("div")
    var input = createInputField("", State.game.getInviteLink(), () => {}, "", ["*"], "link-input")
    input.onclick = () => {
        input.select()
        input.setSelectionRange(0, 9999)
        document.execCommand("copy")
        input.value = "Link kopiert"
        setTimeout(() => {
            input.value = State.game.getInviteLink()
        }, 2000)
    }
    link_div.appendChild(input)
    div.appendChild(link_div)

    return div
}
