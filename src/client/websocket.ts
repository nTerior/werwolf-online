import { WSPacket } from "../wspacket"
import { EventEmitter } from "events"

export async function createWS(): Promise<WS> {
    console.log("Connecting to Websocket server....")
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
            console.log("connected")
            this.emit("preready")
        }
        this.ws.onclose = (e) => {
            console.log("disconnected")
        }
        this.once("preready", async () => {
            console.log("preready")
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
        var j: WSPacket = JSON.parse(data)
        this.emit("packet-" + j.id, j)
        this.emit("event-" + j.name, j.data)
    }

    private async recvPacket(id: number): Promise<WSPacket> {
        return new Promise((r) => {
            this.once("packet-" + id, (d) => {
                console.log(`Received a ${d.name} packet: ` + d.data)
                r(d)
            })
        })
    }

    private sendPacket(name: string, data: any): number {
        console.log(`Sending a ${name} packet:` + data)
        var id = Math.floor(Math.random() * 1000000)
        this.ws.send(JSON.stringify({ name, data, id }))
        return id
    }
 
    async packetIO(name: string, data: any): Promise<any | undefined> {
        var id = this.sendPacket(name, data)
        var res = await this.recvPacket(id)
        if (res.name == "error") {
            console.log(`SERVER RESPONDED WITH ERROR:` + res.data)
            return undefined
        }
        return res.data
    }

    public setName() {
        var name = <HTMLInputElement>document.getElementById("name")
        this.sendPacket("set-name", {name: name.value})
    }

    async getName(): Promise<string> {
        return await this.packetIO("get-name", {})
    }
}
