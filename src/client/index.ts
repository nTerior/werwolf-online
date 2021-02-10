import { devInit } from "./dev"
import { setScreen } from "./screen"
import { generateMainScreen } from "./screens/screenMain"
import { loadRoleDescriptions, State } from "./state"
import { createWS } from "./websocket"

async function init() {
    document.body.classList.add("theme")
    document.addEventListener( "contextmenu", function(e) {
        e.preventDefault()
    });
    await loadRoleDescriptions()
    State.ws = await createWS()
    devInit()
    setScreen(generateMainScreen())
}

window.onload = init
