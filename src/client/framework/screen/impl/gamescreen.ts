import { Packet } from "../../../../packet";
import { RoleName } from "../../../../role";
import { getEnumKeyByEnumValue } from "../../../../utils";
import { Player } from "../../../game/player";
import { State } from "../../../state";
import { Message } from "../../message";
import { createDivText, createHeader, createText } from "../../text";
import { Screen } from "../screen";

export function generateGameScreen(): Screen {
    new Message("Das Spiel startet nun").display()
    var div = document.createElement("div")

    div.appendChild(createHeader("h2", "Du bist ein(e) " + State.game.getSelfPlayer().role?.name))
    div.appendChild(createText(State.role_info_text[getEnumKeyByEnumValue(RoleName, State.game.getSelfPlayer().role!.name)?.toLowerCase()!]))
    div.appendChild(createUserList())
    div.appendChild(createRoleCounts())

    return {
        element: div,
        title: "Im Spiel"
    }
}

function createRoleCounts(): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("ingame-settings-info", "game-info-inline")

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

    var div = document.createElement("div")
    div.classList.add("game-user-list", "game-info-inline")

    var count = createHeader("h3", "Spieler: " + State.game.players.length)
    div.appendChild(count)

    State.ws.setOnPacket("player-left", async packet => {
        var index = State.game.players.findIndex(e => e.id == packet.data.id)
        new Message(State.game.players[index].name + " hat das Spiel verlassen").display()
        State.game.players.splice(index, 1)

        div.removeChild(document.getElementById("game-player-" + packet.data.id)!)

        var tmp = State.game.self_is_owner

        State.game.self_is_owner = (await State.ws.sendAndRecvPacket(new Packet("is_owner", State.game.id))).data
        if(State.game.self_is_owner && !tmp) new Message("Du bist nun der Host", -1).display()

        count.textContent = "Spieler: " + State.game.players.length
                
        if(packet.data.role) {
            //@ts-expect-error
            State.game.role_counts[packet.data.role]--
            //@ts-expect-error
            updateRoleCount(getEnumKeyByEnumValue(RoleName, packet.data.role))
        }
    })

    State.game.players.forEach(p => {
        div.appendChild(createUser(p))
    })

    return div
}

function createUser(p: Player): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("game-player")
    div.id = "game-player-" + p.id
    
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
    var div = document.getElementById("game-player-" + id)!;
    (<HTMLImageElement>(div.getElementsByClassName("game-player-image")[0])).src = State.game.players.find(e => e.id == id)!.getImage().src
}
