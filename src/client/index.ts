import { devInit } from "./dev"
import { ActionMenu } from "./framework/actionmenu"
import { disableContextMenu, setGlobalBackground } from "./framework/framework"
import { generateStartScreen } from "./framework/screen/impl/startscreen"
import { nextScreen } from "./framework/screen/screen"
import { loadRolePopupTexts, State } from "./state"
import { WebsocketClient } from "./websocket"

async function init() {

    await loadRolePopupTexts()

    await initWebsocket()
    devInit()
    disableContextMenu()
    setGlobalBackground("background_day.png")
    nextScreen(generateStartScreen())

    new ActionMenu("Titel", "Lorem Ipsum", true, {name: "asdf", onclick:()=>{}}, {name: "asdf", onclick:()=>{}}, {name: "asdf", onclick:()=>{}}).show()
}

async function initWebsocket() {
    var ws = new WebsocketClient("ws://localhost:5354")
    await ws.start()
    State.ws = ws
}

window.onload = init
