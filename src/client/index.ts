import { Screen, pushScreen, popScreen } from "./screen"
import { generateMainScreen } from "./screens/screenMain"

async function init() {
    pushScreen(generateMainScreen())
}

window.onload = init
