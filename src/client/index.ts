import { devInit } from "./dev"
import { generateStartScreen } from "./framework/screen/impl/startscreen"
import { nextScreen } from "./framework/screen/screen"
import { State } from "./state"
import { WebsocketClient } from "./websocket"

async function init() {
    await initWebsocket()
    devInit()
    nextScreen(generateStartScreen())
}

async function initWebsocket() {
    var ws = new WebsocketClient("ws://localhost:5354")
    await ws.start()
    State.ws = ws
}

window.onload = init
