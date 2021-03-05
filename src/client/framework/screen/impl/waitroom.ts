import { Packet } from "../../../../packet"
import { getNewRoleByRoleName, RoleName } from "../../../../role"
import { Settings } from "../../../../settings"
import { Player } from "../../../game/player"
import { State } from "../../../state"
import { createButton } from "../../button"
import { createCheckbox, createInputField } from "../../input"
import { Message, Urgency } from "../../message"
import { createHeader, createText } from "../../text"
import { nextScreen, Screen } from "../screen"
import { generateGameScreen } from "./gamescreen"

function getEnumKeyByEnumValue<T extends {[index:string]:string}>(myEnum:T, enumValue:string):keyof T|null {
    let keys = Object.keys(myEnum).filter(x => myEnum[x] == enumValue);
    return keys.length > 0 ? keys[0] : null;
}


export async function generateWaitRoomScreen(): Promise<Screen> {
    var div = document.createElement("div")

    div.appendChild(createHeader("h2", "Warteraum"))
    div.appendChild(createText("Du spielst gleich eine Runde Werwolf. Zu Beginn wird dir deine Rolle gezeigt und du erhälst eine Beschreibung der Rolle die du spielst. Um eine Aktion auszuführen, wenn du dran bist, mussst du auf den Spieler klicken, bei dem du diese Aktion ausführen willst."))

    div.appendChild(await createUserList())
    div.appendChild(createSettings())
    
    State.ws.setOnPacket("game-started", (packet) => {
        //@ts-expect-error
        State.game.players[State.game.players.findIndex(e => e.is_self)].role = getNewRoleByRoleName(getEnumKeyByEnumValue(RoleName, packet.data["role"]))
        nextScreen(generateGameScreen())
        new Message("Du bist ein(e) " + packet.data["role"] + ".").display()
    })

    return {
        element: div,
        title: "Warteraum",
        on_pop: () => {
            State.ws.removeAllListeners("player-joined")
            State.ws.removeAllListeners("player-left")
            State.ws.removeAllListeners("game-started")
        }
    }
}

async function createUserList(): Promise<HTMLDivElement> {

    var list: {name: string, id: string, is_self: boolean}[] = (await State.ws.sendAndRecvPacket(new Packet("get-player-list", State.game.id))).data
    list.forEach(e => {
        State.game.players.push(new Player(e.name, e.id, e.is_self))
    })

    var div = document.createElement("div")
    div.classList.add("user-list")
    State.game.players.forEach(player => {
        div.appendChild(createUser(player))
    })

    State.ws.setOnPacket("player-joined", packet => {
        var player: Player = new Player(packet.data.name, packet.data.id, false)
        State.game.players.push(player)
        new Message(player.name + " ist dem Spiel beigetreten").display()
        div.appendChild(createUser(player))
    })
    State.ws.setOnPacket("player-left", async packet => {
        div.removeChild(document.getElementById("user-element-" + packet.data.id)!)
        var index = State.game.players.findIndex(e => e.id == packet.data.id)
        new Message(State.game.players[index].name + " hat das Spiel verlassen").display()
        State.game.players.splice(index, 1)

        var tmp = State.game.self_is_owner

        State.game.self_is_owner = (await State.ws.sendAndRecvPacket(new Packet("is_owner", State.game.id))).data
        if(State.game.self_is_owner && !tmp) new Message("Du bist nun der Host", -1).display()
        updateRoleInputs()
    })
    return div
}

function createUser(player: Player): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("user-element")
    div.id = "user-element-" + player.id

    var img = document.createElement("img")
    img.src = "/static/assets/characters/villager.png"
    img.alt = "Bild fehl!"
    div.appendChild(img)

    var name = document.createElement("div")
    name.classList.add("user-name")
    if(player.is_self) {
        name.classList.add("self-user-name")
    }
    name.textContent = player.name
    div.appendChild(name)

    return div
}

function updateRoleInputs() {
    var admin = State.game.self_is_owner
    for(var role in RoleName) {
        var el = (<HTMLInputElement>document.getElementById("role-value-" + role))
        el.disabled = !admin
    }
    (<HTMLInputElement>document.getElementById("game-settings-death-reveal")).disabled = !admin;
    (<HTMLButtonElement>document.getElementById("start-game")).hidden = !admin;
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

    div.appendChild(createCheckbox("Rollen nach Tod veröffentlichen", false, () => {}, "game-settings-death-reveal", admin, "checkbox-settings"));
    
    var link_div = document.createElement("div")
    var input = createInputField("", State.game.getInviteLink(), () => {}, "", ["*"], "link-input")
    input.onclick = () => {
        input.value = State.game.getInviteLink()
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

    var startbtn = createButton("Spiel starten", async () => await startGame(), "start-game-btn")
    startbtn.hidden = !admin
    startbtn.id = "start-game"
    div.appendChild(startbtn)

    return div
}

async function startGame() {
    var gamesettings: Settings = buildSettings()

    var sum = sumRoles(gamesettings)
    if(State.game.players.length > sum) {
        new Message("Es müssen noch " + (State.game.players.length - sum) + " Rollen vergeben werden!", 5000, Urgency.ERROR).display()
        return
    } else if(State.game.players.length < sum) {
        new Message("Es müssen noch " + (sum - State.game.players.length) + " Spieler mitspielen!", 5000, Urgency.ERROR).display()
        return
    }

    var result: Packet = await State.ws.sendAndRecvPacket(new Packet("start-game", {settings: gamesettings, game_id: State.game.id}))
    if(result.data) new Message(result.data.toString(), 5000, Urgency.ERROR).display()
}

function sumRoles(settings: Settings) {
    var amount = 0
    amount += settings.settings.role_settings.Amor!
    amount += settings.settings.role_settings.Dorfbewohner!
    amount += settings.settings.role_settings.Hexe!
    amount += settings.settings.role_settings.Jäger!
    amount += settings.settings.role_settings.Matratze!
    amount += settings.settings.role_settings.Mädchen!
    amount += settings.settings.role_settings.Seherin!
    amount += settings.settings.role_settings.Werwolf!
    return amount
}

function buildSettings(): Settings {
    var settings: Settings = new Settings()
    for(var role in RoleName) {
        var el = (<HTMLInputElement>document.getElementById("role-value-" + role))
        //@ts-expect-error
        settings.set("role_settings", parseInt(el.value), RoleName[role])
    }
    settings.set("reveal_role_death", (<HTMLInputElement>document.getElementById("game-settings-death-reveal")).checked)
    return settings
}
