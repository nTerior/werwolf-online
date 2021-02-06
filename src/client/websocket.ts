import { WSPacket } from "../wspacket"
import { EventEmitter } from "events"

export async function createWS(): Promise<WS> {
    var wsi = new WebSocket(`ws://${window.location.host}/api/ws`)
    var ws = new WS(wsi)
    await ws.waitReady()
    return ws;
}

export class WS extends EventEmitter {
    private ws: WebSocket

    constructor(ws: WebSocket) {
        super()
        this.ws = ws
        this.ws.onmessage = (ev) => this.onmessage(ev.data)
        this.ws.onopen = () => {
            this.emit("preready")
        }
        this.ws.onclose = (e) => {
            console.log("Disconnected")
        }
        this.once("preready", async () => {
            var name = <HTMLInputElement>document.getElementById("name")
            this.sendPacket("set-name", {name: name})
            this.emit("ready")
        })
    }
    
    async waitReady(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.on("ready", () => {
                resolve()
            })
        })
    }

    private onmessage(data: string) {
        var packet: WSPacket = JSON.parse(data)
        this.emit("packet-" + packet.id, packet)
        this.emit("event-" + packet.name, packet)
    }

    private async recvPacket(id: number): Promise<WSPacket> {
        return new Promise((r) => {
            this.once("packet-" + id, (d) => {
                r(d)
            })
        })
    }

    private sendPacket(name: string, data: any): number {
        var id = Math.floor(Math.random() * 1000000)
        this.ws.send(JSON.stringify({ name, data, id }))
        return id
    }

    async packetIO(name: string, data: any): Promise<any | undefined> {
        var id = this.sendPacket(name, data)
        var res = await this.recvPacket(id)
        if (res.name == "error") {
            console.log("Server responded with error: " + res.data)
            return undefined
        }
        return res.data
    }

    async getName(): Promise<string | undefined> {
        return await this.packetIO("get-name", {})
    }

}
