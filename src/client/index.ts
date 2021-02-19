import { Packet } from "../packet"
import { State } from "./state"
import { WebsocketClient } from "./websocket"

async function init() {
    await initWebsocket()
}

async function initWebsocket() {
    var ws = new WebsocketClient("ws://localhost:5354")
    await ws.start()
    State.ws = ws
    State.ws.sendPacket(new Packet("asd"))
}

window.onload = init
