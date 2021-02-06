import { setScreen } from "./screen"
import { generateMainScreen } from "./screens/screenMain"

async function init() {
    setScreen(generateMainScreen())
}

window.onload = init
