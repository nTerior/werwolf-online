import { Packet } from "../../../../packet";
import { State } from "../../../state";
import { Message } from "../../message";
import { Screen } from "../screen";

export function generateGameScreen(): Screen {
    new Message("Das Spiel startet nun").display()
    var div = document.createElement("div")

    State.ws.setOnPacket("player-left", async packet => {
        var index = State.game.players.findIndex(e => e.id == packet.data.id)
        new Message(State.game.players[index].name + " hat das Spiel verlassen").display()
        State.game.players.splice(index, 1)

        var tmp = State.game.self_is_owner

        State.game.self_is_owner = (await State.ws.sendAndRecvPacket(new Packet("is_owner", State.game.id))).data
        if(State.game.self_is_owner && !tmp) new Message("Du bist nun der Host", -1).display()
    })

    return {
        element: div,
        title: "Im Spiel"
    }
}