import { Screen } from "../screen"
import { get_game_id } from "../util"

export function generateMainScreen(): Screen {
    var div = document.createElement("div")
    div.id = "main-screen"
    
    var header = document.createElement("h1")
    header.textContent = "Werwölfe"
    div.appendChild(header)

    var name = document.createElement("input")
    name.id = "name"
    name.placeholder = "Dein Name"
    div.appendChild(name)

    div.appendChild(document.createElement("br"))

    var join_button = document.createElement("button")
    join_button.textContent = "Spiel beitreten"
    if(get_game_id()) div.appendChild(join_button)

    var create_button = document.createElement("button")
    create_button.textContent = "Spiel erstellen"
    div.appendChild(create_button)

    return {
        element: div,
        title: "Werwölfe"
    }
}