import { Screen, pushScreen, popScreen } from "./screen"
import { generateMainScreen } from "./screens/screenMain"
import { displayCookieBanner } from "./cookies"

async function init() {
    //pushScreen(generateMainScreen())
    displayCookieBanner()
}

window.onload = init
