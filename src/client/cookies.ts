import { ok } from "assert"
import { get_root } from "./screen"

export function displayCookieBanner() {
    var div = document.createElement("div")
    div.classList.add("cookie-banner")

    var content = document.createElement("div")
    content.classList.add("cookie-banner-content")

    var header = document.createElement("h1")
    header.classList.add("cookie-banner-header")
    header.textContent = "Cookies"
    content.appendChild(header)

    var text = document.createElement("p")
    text.textContent = "Die EU will, dass ich dieses Banner zeige, damit Sie wissen, dass diese Website Cookies verwendet. Diese werden verwendet, um das Spiel spielbar zu machen.\nEs werde keine Tracker eingesetzt oder Daten gesammelt."
    content.appendChild(text)

    var no_button = document.createElement("a")
    no_button.href = "https://de.wikipedia.org/wiki/Die_Werw%C3%B6lfe_von_D%C3%BCsterwald"
    no_button.textContent = "Nö, doch kein Bock"
    no_button.onclick = () => {
        window.close()
    }
    content.appendChild(no_button)

    var ok_button = document.createElement("button")
    ok_button.textContent = "OK, jetzt lass mich spielen"
    ok_button.onclick = () => {
        get_root()?.removeChild(div)
    }
    content.appendChild(ok_button)
    div.appendChild(content)
    get_root()?.appendChild(div)
}