import * as lws from "ws"
import { v4 } from "uuid"
import { WSPacket } from "../wspacket"
import { dev_events } from "./dev"
import { addPlayer, createGame, deleteGame, Game, getGame, removePlayer } from "./game/game"
import { RoleName } from "../role"


interface FnRes {
    ok?: any,
    error?: {
        title: string,
        data?: any
    }
}

var ws_connections: { id: string, ws: lws, name?: string, game?: Game }[] = []

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
        if(ws_connections[ws_connections.findIndex(e => e.id == id)] != undefined) {
            var game: Game | undefined = ws_connections[ws_connections.findIndex(e => e.id == id)].game
            if(game != undefined) {
                wsPacketHandler["quit-game"]({id: game.id}, ws, id)
                if(game.players.length == 0) {
                    deleteGame(game.id)
                }
            }
        }
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

function get_ws(id:string) {
    return ws_connections[ws_connections.findIndex(e => e.id == id)]
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
    },
    "create-game": async (data, ws, wsid) => {
        return {ok: createGame(wsid).id}
    },
    "join-game": async (data, ws, wsid) => {
        var success = addPlayer(data["id"], get_ws(wsid).name!, get_ws(wsid).ws, wsid)
        if(!success) return {error: {title: "Game is inexistent", data: "No Game like this"}}
        ws_connections[ws_connections.findIndex(e => e.id == wsid)].game = getGame(data["id"])
        getGame(data["id"])?.players.forEach((player) => {
            if(player.ws == ws) return
            var packet: WSPacket = {name: "joined", data: {name: get_ws(wsid).name!}, id: 0}
            player.ws.send(JSON.stringify(packet))
        })
        return {ok: success}
    },
    "quit-game": async (data, ws, wsid) => {
        var success = removePlayer(data["id"], get_ws(wsid).ws)
        if(!success) return {error: {title: "No such game"}}

        var game = getGame(data["id"])!
        if(game.players.length != 0) {
            game.owner = game.players[0].id
            game.players.forEach((player) => {
                var packet: WSPacket = {name: "quitted", data: {}, id: 0}
                player.ws.send(JSON.stringify(packet))
            })
        }
        return {ok: success}
    },
    "get-players": async (data, ws, wsid) => {
        var players = getGame(data["id"])?.players!
        var names:{name: string, id: string, major: boolean, dead:boolean}[] = []
        players.forEach(p => {
            var name = p.name
            if (p.ws == ws) name += " (Du)"
            names.push({name: name, id: p.id, major: p.major, dead: p.dead})
        })
        return {ok: names}
    },
    "is-mod": async(data, ws, wsid) => {
        return {ok: getGame(data["id"])?.owner == wsid}
    },
    "start-game": async(data, ws, wsid) => {

        if(getGame(data["id"])?.owner != wsid) return {error: {title: "Nope"}}

        var game = getGame(data["id"])!
        game.players.forEach((player) => {
            var packet: WSPacket = {name: "start-game", data: {}, id: 0}
            player.ws.send(JSON.stringify(packet))
        })
        game.roles = data["roles"]
        console.log(game.roles)
        game.start()

        return {ok: "ok"}
    },
    "can-interact": async(data, ws, wsid) => {

        var game = getGame(data["game_id"])
        var self = game?.getPlayer(wsid)!
        var target = game?.getPlayer(data["user_id"])!

        if(self.dead) return {ok: false}
        if(target.dead) return {ok: false}
        if(self.role?.name == RoleName.VILLAGER) return {ok: false}
        if(self.role?.name == RoleName.WERWOLF && target.role?.name == RoleName.WERWOLF) return {ok: false}

        return {ok: true}
    },
    "next-move": async(data, ws, wsid) => {
        var game = getGame(data["id"])
        game?.moveDone()
        return {ok: true}
    },

    "execute-seer": async(data, ws, wsid) => {
        var game = getGame(data["game_id"])!
        var player = game.getPlayer(data["user_id"])!
        return {ok: player.role!.name}
    },
    "witch-get-prey": async(data, ws, wsid) => {
        var game = getGame(data["game_id"])
        var prey = game?.players[game.prey_index]
        return {ok: prey?.id}
    },
    "witch-heal-prey": async(data, ws, wsid) => {
        getGame(data["game_id"])!.prey_index = -1
        return {ok: true}
    },
    "witch-kill-other": async(data, ws, wsid) => {
        getGame(data["game_id"])!.kill(data["user_id"])
        return {ok: true}
    },
    "amor-love": async(data, ws, wsid) => {
        getGame(data["game_id"])!.getPlayer(data["user_id"]).inLove = true
        return {ok: true}
    }
}
