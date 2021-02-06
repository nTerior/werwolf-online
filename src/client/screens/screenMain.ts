import { Screen } from "../screen"

export function generateMainScreen(): Screen {
    var div = document.createElement("div")
    div.id = "main_screen"
    div.textContent = "Main Screen"

    return {
        element: div,
        title: "Werwölfe",
        on_push: () => {
            console.log("Pushed Main Screen")
        },
        main_element: true
    }
}