import EventEmitter from "events";
import { Packet } from "../packet";
import { Message } from "./framework/message";

export class WebsocketClient extends EventEmitter {
    private ws: WebSocket

    constructor(path: string) {
        super()
        
        this.ws = new WebSocket(path)
        this.ws.onmessage = (ev) => this.onmessage(ev.data)
        this.ws.onopen = () => this.emit("preopen")
        this.ws.onclose = () => this.emit("closed")
        this.once("preopen", async () => this.emit("open"))
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.on("open", () => {
                resolve()
            })
        })
    }

    private onmessage(data: string) {
        var packet: Packet = Packet.deserialize(data)
        console.log(packet)
        this.emit("packet-" + packet.name, packet)
        this.emit("packet-id-" + packet.id, packet)
    }

    public setOnPacket(packet_name: string, coro: (data: any) => any) {
        this.on("packet-" + packet_name, coro)
    }

    async recvExplicitPacket(identifier: string, type: "id" | "name" = "id"): Promise<Packet> {
        return new Promise((r) => {
            if(type == "id") this.once("packet-id-" + identifier, (d) => r(d))
            else this.once("packet-" + identifier, (d) => r(d))
        })
    }

    public sendPacket(packet: Packet): void {
        this.ws.send(packet.serialize())
    }

    async sendAndRecvPacket(packet: Packet): Promise<Packet> {
        this.sendPacket(packet)
        console.log(packet)
        return await this.recvExplicitPacket(packet.id)
    }
}