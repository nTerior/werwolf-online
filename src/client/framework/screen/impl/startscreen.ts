import { createButton } from "../../button"
import { addBreak } from "../../framework"
import { createInputField } from "../../input"
import { createHeader } from "../../text"
import { get_game_id } from "../../urlutils"
import { Screen } from "../screen"

export function generateStartScreen(): Screen {
    var div = document.createElement("div")

    div.appendChild(createHeader("h1", "Werwölfe"))
    div.appendChild(createInputField("Name", "", () => {
        if(get_game_id()) joinGameButton()
        else createGameButton()
    }, []))

    addBreak(div)
    if(get_game_id()) div.appendChild(createButton("Spiel beitreten", () => joinGameButton(), "btn-inline"))
    div.appendChild(createButton("Spiel erstellen", () => createGameButton(), "btn-inline"))

    var copyright = document.createElement("div")
    copyright.id = "copyright"
    copyright.textContent = "by Paul Stier"
    div.appendChild(copyright)

    return {
        element: div
    }
}

function joinGameButton() {
    
}

function createGameButton() {
    
}
