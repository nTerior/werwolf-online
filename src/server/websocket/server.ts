import { Server } from "ws"
import * as lws from "ws"
import { v4 } from "uuid"
import { Packet } from "../../packet"
import { dev_events } from "../dev"
import { Game, getGame } from "../game/game"
import { getNewRoleByRoleName, RoleName } from "../../role"

export interface PacketResult {
    result?: any,
    error?: {
        title: string,
        data?: any
    }
}

const devPacket = new Packet("dev-packet", { css_reload: true })

var connections: { id: string, ws: lws, game?: Game }[] = []
const packetHandler: { [key: string]: (data: any, ws: lws, wsid: string) => Promise<PacketResult> } = {
    "create-game": async (data, ws, wsid) => {
        var game = new Game(wsid)
        console.log("Game \"" + game.id + "\" was created by " + wsid)
        return { result: game.id }
    },
    "join-game": async (data, ws, wsid) => {
        var name = data.name
        var game_id = data.game_id
        var game = getGame(game_id)

        if (!game) return { error: { title: "Spiel nicht gefunden", data: "Das Spiel mit der ID \"" + game_id + "\" wurde nicht gefunden" } }
        if (!game.checkName(name)) return { error: { title: "Dieser Name ist bereits vergeben", data: "\"" + name + "\" ist bereits vergeben" } }
        if (game.running) return { error: { title: "Das Spiel läuft bereits", data: "Das Spiel läuft bereits" } }

        connections.find(e => e.ws == ws)!.game = game
        game.addPlayer(name, wsid, ws)
        return { result: "success" }
    },
    "quit-game": async (data, ws, wsid) => {
        getGame(data)?.removePlayer(wsid)
        return {}
    },
    "get-player-list": async (data, ws, wsid) => {
        var player_list = getGame(data)!.players
        var mani_list: { name: string, id: string, is_self: boolean }[] = []

        player_list.forEach(player => {
            if (player.id == wsid) mani_list.push({ name: player.name + " (Du)", id: player.id, is_self: true })
            else mani_list.push({ name: player.name, id: player.id, is_self: false })
        })

        return { result: mani_list }
    },
    "is_owner": async (data, ws, wsid) => {
        return { result: getGame(data)!.is_owner(wsid) }
    },
    "start-game": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        if (!game.is_owner(wsid)) return { error: { title: "Not an owner", data: "Du bist nicht der Host des Spiels!" } }
        game.settings = data["settings"]
        game.start()
        return { ok: true }
    },
    "player-perform-turn": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        game.events.emit("player-perform-turn", wsid, data["target_id"], data["sub_command"])
        return {}
    },
    "chat-msg-sent": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        var player = game.getPlayer(wsid)!
        if (![RoleName.WEREWOLF, RoleName.GIRL].includes(player.role!.name)) return {}
        getNewRoleByRoleName(RoleName.WEREWOLF)!.sendAll(game, new Packet("recv-chat-message", { author: data["author"], content: data["content"] }), true)
        getNewRoleByRoleName(RoleName.GIRL)!.sendAll(game, new Packet("recv-chat-message", { author: data["author"], content: data["content"] }), true)
        return {}
    },
    "witch-get-prey": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        var player = game.getPlayer(wsid)!
        if (player.role!.name != RoleName.WITCH) return {}
        if (!game.roles_turn.includes(player.role!.name)) return {}

        return { result: game.werewolf_prey }
    },
    "seer-reveal-role": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        var player = game.getPlayer(wsid)!
        if (player.role!.name != RoleName.SEER) return {}
        if (!game.roles_turn.includes(player.role!.name)) return {}
        if (data.target == "") return {}
        return { result: game.getPlayer(data.target)?.role!.name }
    },
    "majorSuggestVote": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        var player = game.getPlayer(wsid)!
        if (player.dead) return {}
        if (!game.majorSuggestions.includes(data["suggestion"])) {
            game.majorSuggestions.push(data["suggestion"])
            game.players.forEach(p => {
                p.ws.send(new Packet("recv-status-message", player.name + " hat " + game.getPlayer(data["suggestion"])!.name + " zur Wahl aufgestellt.").serialize())
                p.ws.send(new Packet("majorVoteSuggestion", data["suggestion"]).serialize())
            })
        }
        return {}
    },
    "majorVoted": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        game.events.emit("playerVoteMajor", game.getPlayer(wsid)!, data["vote"])
        return {}
    },
    "hunterPerformAction": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        var player = game.getPlayer(wsid)!
        if (player.role!.name != RoleName.HUNTER) return {}
        game.events.emit("hunter-perform-kill", data["target_id"])
        return {}
    },
    "daySuggestVote": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        var player = game.getPlayer(wsid)!

        if (player.dead) return {}

        var target = game.getPlayer(data["suggestion"])!
        if (!game.dayVoteSuggestions.includes(target)) {
            console.log(target.name + " wurde als Schuldiger vorgeschlagen")
            game.dayVoteSuggestions.push(target)
            game.players.forEach(p => {
                p.ws.send(new Packet("recv-status-message", player.name + " hat " + target.name + " angeklagt.").serialize())
                p.ws.send(new Packet("dayVoteSuggestion", data["suggestion"]).serialize())
            })
            return { result: true }
        }

        return { result: false }
    },
    "dayVoted": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        game.events.emit("playerVoteDay", game.getPlayer(wsid)!, data["vote"])
        return {}
    },
    "majorExecution": async (data, ws, wsid) => {
        var game: Game = getGame(data["game_id"])!
        game.events.emit("majorExecution", data["target"])
        return {}
    }
}

export class WebsocketServer {
    private ws: Server
    private on_close?: (ws: lws) => void

    constructor(port: number) {
        this.ws = new Server({ port: port })
        this.ws.setMaxListeners(1000)
    }

    public start(): void {
        this.ws.on("connection", this.onConnect)
    }

    private onConnect(ws: lws): void {
        var id = v4()
        var ready = false

        const devPacketHandler = (data: any) => {
            ws.send(devPacket.serialize())
        }
        dev_events.on("packet", devPacketHandler)
        ws.onclose = async () => {
            dev_events.off("packet", devPacketHandler)
            if (this.on_close) this.on_close(ws)
            if (connections) {
                var index = connections.findIndex(c => c.id == id)
                if (index == -1) return
                if (connections[index].game) {
                    await packetHandler["quit-game"](connections[index].game!.id, ws, id)
                }
                if (index) connections.splice(index, 1)
            }
        }

        ws.onmessage = async (ev) => {
            if (!ready) {
                connections.push({ id: id, ws: ws })
                ready = true
            }

            var packet: Packet = Packet.deserialize(ev.data.toString())
            var result: Packet = new Packet(packet.name)
            result.id = packet.id

            if (packetHandler.hasOwnProperty(packet.name)) {
                var execute_result = await packetHandler[packet.name](packet.data, ws, id)

                if (execute_result.error) {
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
