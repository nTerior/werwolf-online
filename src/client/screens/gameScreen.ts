import { Role } from "../../role"
import { Screen } from "../screen"
import { State } from "../state"

export async function createGameScreen(): Promise<Screen> {
    var div = document.createElement("div")

    State.ws.on("role-reveal", r => {
        var role: Role = r
        State.game.selfplayer.role = role
        alert(role.name)
    })

    return {
        element: div,
        title: "Werwölfe"
    }
}