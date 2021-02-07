import { devInit } from "./dev"
import { setScreen } from "./screen"
import { generateMainScreen } from "./screens/screenMain"
import { State } from "./state"
import { createWS } from "./websocket"

async function init() {
    State.ws = await createWS()
    devInit()
    setScreen(generateMainScreen())
}

window.onload = init
