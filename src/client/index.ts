import { devInit } from "./dev"
import { setGlobalBackground } from "./framework/framework"
import { generateStartScreen } from "./framework/screen/impl/startscreen"
import { nextScreen } from "./framework/screen/screen"
import { Logger } from "./logger"
import { State } from "./state"
import { WebsocketClient } from "./websocket"

async function init() {
    Logger.log([], "Do NOT go there: " + window.location.host + "/error")
    await initWebsocket()
    devInit()
    setGlobalBackground("background_day.png")
    nextScreen(generateStartScreen())
}

async function initWebsocket() {
    var ws = new WebsocketClient("ws://localhost:5354")
    await ws.start()
    State.ws = ws
}

window.onload = init
