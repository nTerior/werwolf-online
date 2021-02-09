import { Screen } from "../screen"

export function createGameScreen(): Screen {
    var div = document.createElement("div")

    return {
        element: div,
        title: "Werwölfe"
    }
}