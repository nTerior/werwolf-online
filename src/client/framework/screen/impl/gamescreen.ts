import { Message } from "../../message";
import { Screen } from "../screen";

export function generateGameScreen(): Screen {
    new Message("Das Spiel startet nun").display()
    var div = document.createElement("div")
    return {
        element: div,
        title: "Im Spiel"
    }
}