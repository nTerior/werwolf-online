import { Server } from "ws"
import * as lws from "ws"
import { v4 } from "uuid"
import { Packet } from "../../packet"

export interface PacketResult {
    result?: any,
    error?: {
        title: string,
        data?: any
    }
}
var connections: {id: string, ws: lws}[] = []
const packetHandler: {[key:string]: (data:any, ws: lws, wsid: string) => Promise<PacketResult>} = {
    
}

export class WebsocketServer {
    private ws: Server
    private on_close?: (ws: lws) => void

    constructor(port: number) {
        this.ws = new Server({port: port})
    }

    public start(): void {
        this.ws.on("connection", this.onConnect)
    }

    private onConnect(ws: lws): void {
        var id = v4()
        var ready = false

        ws.onclose = () => {
            if(this.on_close) this.on_close(ws)
            if(connections) connections.splice(connections.findIndex(c => c.id == id), 1)
        }

        ws.onmessage = async (ev) => {
            if(!ready) {
                connections.push({id: id, ws: ws})
                ready = true
            }

            var packet: Packet = Packet.deserialize(ev.data.toString())
            var result: Packet = new Packet(packet.name, packet.id)

            if(packetHandler.hasOwnProperty(packet.name)) {
                var execute_result = await packetHandler[packet.name](packet.data, ws, id)
                
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
}

export function getConnectionById(id: string): lws | undefined {
    var res = connections.find(c => c.id == id)
    return res ? res.ws : undefined
}
export function getIdByConnection(ws: lws): string | undefined {
    var res = connections.find(c => c.ws == ws)
    return res ? res.id : undefined
}
