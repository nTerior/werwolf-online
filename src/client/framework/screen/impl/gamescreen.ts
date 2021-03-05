import { Packet } from "../../../../packet";
import { Player } from "../../../game/player";
import { State } from "../../../state";
import { Message } from "../../message";
import { createDivText, createText } from "../../text";
import { Screen } from "../screen";

export function generateGameScreen(): Screen {
    new Message("Das Spiel startet nun").display()
    var div = document.createElement("div")

    div.appendChild(createUserList())

    return {
        element: div,
        title: "Im Spiel"
    }
}

function createUserList(): HTMLDivElement {

    var div = document.createElement("div")
    div.classList.add("game-user-list")

    State.ws.setOnPacket("player-left", async packet => {
        var index = State.game.players.findIndex(e => e.id == packet.data.id)
        new Message(State.game.players[index].name + " hat das Spiel verlassen").display()
        State.game.players.splice(index, 1)

        div.removeChild(document.getElementById("game-player-" + packet.data.id)!)

        var tmp = State.game.self_is_owner

        State.game.self_is_owner = (await State.ws.sendAndRecvPacket(new Packet("is_owner", State.game.id))).data
        if(State.game.self_is_owner && !tmp) new Message("Du bist nun der Host", -1).display()
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
    div.appendChild(p.getImage())
    div.appendChild(createDivText(p.name))
    return div
}

function updateUser(id: string) {

}
