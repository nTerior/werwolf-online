import { RoleName } from "../../role"
import { Screen } from "../screen"
import { State } from "../state"

export async function createGameScreen(): Promise<Screen> {
    var div = document.createElement("div")

    State.ws.on("role-reveal", r => {
        alert(r)
        var role: RoleName = r
    })

    return {
        element: div,
        title: "Werwölfe"
    }
}