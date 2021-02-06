import * as lws from "ws"
import { v4 } from "uuid"
import { WSPacket } from "../wspacket"

interface FnRes {
    ok?: any,
    error?: {
        title: string,
        data?: any
    }
}

var ws_connections: {name:string, id: string, ws: lws}[] = []

export function wsBroadcast(packet: WSPacket) {
    ws_connections.forEach(w => {
        w.ws.send(JSON.stringify(packet))
    })
}

export function wsServerConnect(ws: lws) {
    var id = v4()
    var ready = false

    ws.onclose = () => {
        ws_connections.splice(ws_connections.findIndex(e => e.id == id), 1)
    }

    const onafteropen = () => {
        ws_connections.push({name: id, id: id, ws: ws})
    }

    ws.onmessage = async (ev) => {
        if(!ready) {
            onafteropen()
            ready = true
        }

        var packet: WSPacket = JSON.parse(ev.data.toString())

        var res: WSPacket = {
            data: {},
            id: packet.id,
            name: packet.name
        }

        if(wsPacketHandler.hasOwnProperty(packet.name)) {
            var fnres: FnRes = await wsPacketHandler[packet.name](packet.data, ws, id)
            if (fnres.error) {
                res.name = "error"
                res.data = fnres.error
            } else {
                res.data = fnres.ok
            }
        } else {
            res.name = "error"
            res.data = "Packet unknown: " + packet.name
        }

        ws.send(JSON.stringify(res))
    }

}

const wsPacketHandler: {[key:string]: (data:any, ws: lws, wsid: string) => Promise<FnRes>} = {
    "set-name": async (data, ws, wsid) => {
        for (var i in ws_connections) {
            if (ws_connections[i].id == wsid) {
                ws_connections[i].name = data["name"];
                return {ok: "ok"}
            }
          }
        return {error: {title: "User not found", data: "User not found"}}
    },
    "get-name": async (data, ws, wsid) => {
        for (var i in ws_connections) {
            if (ws_connections[i].id == wsid) {
                return {ok: ws_connections[i].name}
            }
          }
        return {error: {title: "User not found", data: "User not found"}}
    }
}
