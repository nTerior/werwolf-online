import { Server as WSServer } from "ws"
import * as lws from "ws"
import { v4 } from "uuid"
import { Packet } from "./packet"

export interface PacketResult {
    result?: any,
    error?: {
        title: string,
        data?: any
    }
}

export class WebsocketServer extends WSServer {
    private connections: {id: string, ws: lws}[] = []

    private packetHandler: {[key: string]: (data: any, ws: lws, id: string) => Promise<PacketResult>}

    private on_close?: (ws: lws) => void

    constructor(port: number, packetHandler: {[key: string]: (data: any, ws: lws, id: string) => Promise<PacketResult>}) {
        super({port: port})
        this.packetHandler = packetHandler
    }

    public start(): void {
        this.on("connection", this.onConnect)
    }

    private onConnect(ws: lws): void {
        var id = v4()
        var ready = false

        ws.onclose = () => {
            if(this.on_close) this.on_close(ws)
            if(this.connections) this.connections.splice(this.connections.findIndex(c => c.id == id), 1)
        }

        ws.onmessage = async (ev) => {
            if(!ready) {
                this.connections.push({id: id, ws: ws})
                ready = true
            }

            var packet: Packet = Packet.deserialize(ev.data.toString())
            var result: Packet = new Packet(packet.name, packet.id)

            if(this.packetHandler.hasOwnProperty(packet.name)) {
                var execute_result = await this.packetHandler[packet.name](packet.data, ws, id)
                
                if(execute_result.error) {
                    result.name = execute_result.error.title
                    result.data = execute_result.error.data
                } else {
                    result.data = execute_result.result
                }

            } else {
                result.name = "PacketUnknownError"
                result.data = "Unknown packet: " + packet.name
            }
            ws.send(result.serialize())
        }

    }

    public onClose(on_close: (ws: lws) => void): void {
        this.on_close = on_close
    }

    public getConnectionById(id: string): lws | undefined {
        var res = this.connections.find(c => c.id == id)
        return res ? res.ws : undefined
    }
    public getIdByConnection(ws: lws): string | undefined {
        var res = this.connections.find(c => c.ws == ws)
        return res ? res.id : undefined
    }
}