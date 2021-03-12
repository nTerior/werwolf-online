import { getNewRoleByRoleName, Role, RoleName, Werewolf } from "../../../../role";
import { getEnumKeyByEnumValue } from "../../../../utils";
import { Player } from "../../../game/player";
import { State } from "../../../state";
import { createChat } from "../../chat";
import { displayString } from "../../display";
import { setGlobalBackground } from "../../framework";
import { Message } from "../../message";
import { createDivText, createHeader, createText } from "../../text";
import { Screen, setTitle } from "../screen";

export function generateGameScreen(): Screen {
    setGlobalBackground("night")
    new Message("Das Spiel startet nun").display()
    displayString("Nacht", -1)
    var div = document.createElement("div")

    div.appendChild(createHeader("h2", "Du bist ein(e) " + State.game.getSelfPlayer().role?.name))
    div.appendChild(createText(State.role_info_text[getEnumKeyByEnumValue(RoleName, State.game.getSelfPlayer().role!.name)?.toLowerCase()!]))
    div.appendChild(createUserList())
    div.appendChild(createRoleCounts())

    if([RoleName.WEREWOLF, RoleName.GIRL].includes(State.game.getSelfPlayer().role!.name)) {
        div.appendChild(createChat())
    }

    initGameLogicListeners()

    return {
        element: div,
        title: "Im Spiel"
    }
}

function initGameLogicListeners() {
    State.ws.setOnPacket("daytime", packet => {
        displayString("Tag")
        setTitle("Tag")
    })
    State.ws.setOnPacket("player-died", packet => {
        State.game.players.find(e => e.id == packet.data.id)!.dead = true
        if(packet.data.role) {
            var r: Role = getNewRoleByRoleName(packet.data.role)!
            State.game.players.find(e => e.id == packet.data.id)!.role = r
            new Message(State.game.players.find(e => e.id == packet.data.id)!.name + " (ein(e) " + r.name + ") ist gestorben").display()
            //@ts-expect-error
            State.game.role_counts[packet.data.role]--
            //@ts-expect-error
            updateRoleCount(getEnumKeyByEnumValue(RoleName, packet.data.role))
        } else 
            new Message(State.game.players.find(e => e.id == packet.data.id)!.name + " ist gestorben").display()
        updatePlayer(packet.data.id)
    })
    State.ws.setOnPacket("you-died", packet => {
        displayString("Du bist gestorben!", -1, ["red"])
    })
    State.ws.setOnPacket("your-turn", packet => {
        new Message("Du bist nun dran!").display()
        displayString("Du bist dran", 2000)
        setTitle("Dein Zug")
        State.game.getSelfPlayer().role?.on_turn()
    })
    State.ws.setOnPacket("turn-end", packet => {
        new Message("Dein Zug ist zu Ende").display()
        displayString("Nacht", -1)
        setTitle("Nacht")
    })
    State.ws.setOnPacket("recv-status-message", packet => {
        new Message(packet.data).display()
    })
}

function createRoleCounts(): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("ingame-settings-info", "game-info-inline")
    div.appendChild(createHeader("h3", "Folgende Rollen sind im Spiel:"))

    for(var role in State.game.settings?.settings.role_settings) {
        //@ts-expect-error
        if (State.game.settings?.settings.role_settings[role] == 0) continue
        
        var role_info = document.createElement("div")
        role_info.classList.add("ingame-settings-info-role")
        
        var text
        if(!State.game.settings?.settings.reveal_role_death) {
            //@ts-expect-error
            text = createText(role + ": ? / " + State.game.settings?.settings.role_settings[role])
        } else {
            //@ts-expect-error
            text = createText(role + ": " + State.game.settings?.settings.role_settings[role] + " / " + State.game.settings?.settings.role_settings[role])
        }
        
        text.id = "ingame-settings-info-role-" + getEnumKeyByEnumValue(RoleName, role)
        role_info.appendChild(text)

        div.appendChild(role_info)
    }

    return div
}

function updateRoleCount(role: RoleName) {
    //@ts-expect-error
    (<HTMLParagraphElement>document.getElementById("ingame-settings-info-role-" + role)).textContent = RoleName[role] + ": " + State.game.role_counts[RoleName[role]] + " / " + State.game.settings?.settings.role_settings[RoleName[role]]
}

function createUserList(): HTMLDivElement {

    State.ws.setOnPacket("werewolf-reveal", packet => {
        packet.data.ids.forEach((id: string) => {
            if(id == State.game.getSelfPlayer().id) return
            State.game.players.find(e => e.id == id)!.role = new Werewolf()
            updatePlayer(id)
        });
    })

    var div = document.createElement("div")
    div.classList.add("game-user-list", "game-info-inline")

    var count = createHeader("h3", "Spieler: " + State.game.players.length)
    div.appendChild(count)

    State.ws.setOnPacket("player-left", async packet => {
        var index = State.game.players.findIndex(e => e.id == packet.data.id)
        
        div.removeChild(document.getElementById("game-player-" + packet.data.id)!)
        
        count.textContent = "Spieler: " + State.game.players.length
        
        if(packet.data.role) {
            //@ts-expect-error
            State.game.role_counts[packet.data.role]--
            //@ts-expect-error
            updateRoleCount(getEnumKeyByEnumValue(RoleName, packet.data.role))
        }
        
        new Message(State.game.players[index].name + (packet.data.role ? " (ein(e) " + packet.data.role + ")" : "") + " hat das Spiel verlassen").display()
        
        var tmp = State.game.self_is_owner
        State.game.self_is_owner = packet.data.is_new_host
        if(State.game.self_is_owner && !tmp) new Message("Du bist nun der Host", -1).display()
        
        State.game.players.splice(index, 1)
    })

    State.game.players.forEach(p => {
        div.appendChild(createUser(p))
    })

    return div
}

function createUser(p: Player): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("game-player", "clickable")
    div.id = "game-player-" + p.id
    div.onclick = ev => {
        State.game.getSelfPlayer().role?.on_interact(p)
    }

    var img = p.getImage()
    img.classList.add("game-player-image")
    div.appendChild(img)

    var name = createDivText(p.name)
    name.classList.add("game-player-name")
    if(p.is_self) {
        name.classList.add("self-user-name")
    }
    div.appendChild(name)
    return div
}

function updatePlayer(id: string) {
    var div = document.getElementById("game-player-" + id)!
    if(State.game.players.find(e => e.id == id)!.dead) {
        div.classList.remove("clickable");
        div.classList.add("player-dead");
        div.onclick = ev => {}
    }
    (<HTMLImageElement>(div.getElementsByClassName("game-player-image")[0])).src = State.game.players.find(e => e.id == id)!.getImage().src
}
