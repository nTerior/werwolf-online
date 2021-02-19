import { createButton } from "../../button"
import { addBreak } from "../../framework"
import { createInputField } from "../../input"
import { createHeader } from "../../text"
import { Screen } from "../screen"

export function generateStartScreen(): Screen {
    var div = document.createElement("div")

    div.appendChild(createHeader("h1", "Werwölfe"))
    div.appendChild(createInputField("Name", "", () => {}, []))
    addBreak(div)
    div.appendChild(createButton("Spiel beitreten", () => {}, "btn-inline"))
    div.appendChild(createButton("Spiel erstellen", () => {}, "btn-inline"))

    return {
        element: div
    }
}