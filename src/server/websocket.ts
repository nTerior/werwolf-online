import * as lws from "ws"
import { v4 } from "uuid"
import { WSPacket } from "../wspacket"
import { dev_events } from "./dev"


interface FnRes {
    ok?: any,
    error?: {
        title: string,
        data?: any
    }
}

var ws_connections: { id: string, ws: lws, name?: string }[] = []

export function wsBroadcast(name: string, data: any) {
    ws_connections.forEach(w => {
        var res = { name, data }
        console.log(res);
        w.ws.send(JSON.stringify(res))
    })
}

export function wsServerConnect(ws: lws) {
    var id = v4()
    const devpackethandler = (data: any) => {
        ws.send(JSON.stringify({
            data, id: "dev",
            name: "dev-packet"
        }))
    }
    var ready = false
    dev_events.on("packet", devpackethandler)
    ws.onclose = () => {
        dev_events.off("packet", devpackethandler)
        ws_connections.splice(ws_connections.findIndex(e => e.id == id), 1)
    }
    const onafteropen = () => {
        console.log("Somebody connected!!!")
        ws_connections.push({ id, ws })
    }
    ws.onmessage = async (ev) => {
        if (!ready) {
            onafteropen()
            ready = true
        }
        var j: WSPacket = JSON.parse(ev.data.toString())
        console.log(j);
        var res: WSPacket = {
            data: {},
            id: j.id,
            name: j.name
        }

        if (wsPacketHandler.hasOwnProperty(j.name)) {
            var fnres: FnRes = await wsPacketHandler[j.name](j.data, ws, id)
            if (fnres.error) {
                res.name = "error"
                res.data = fnres.error
            } else {
                res.data = fnres.ok
            }
        } else {
            res.name = "error"
            res.data = "Packet unknown: " + j.name
        }
        console.log(res);
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
                if (ws_connections[i].name) return {ok: ws_connections[i].name}
                return {error: {title: "No name", data: "no Name"}}
            }
          }
        return {error: {title: "User not found", data: "User not found"}}
    }
}
