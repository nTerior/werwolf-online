import { WSPacket } from "../wspacket"
import { EventEmitter } from "events"
import { Role, RoleName, roles } from "../role"
import { State } from "./state"

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
        if(j.name == "joined") this.emit("join", j.data["name"])
        if(j.name == "quitted") this.emit("quit")
        if(j.name == "start-game") this.emit("start-game")
        if(j.name == "role-reveal") this.emit("role-reveal", j.data["role"])
        if(j.name == "player-update") this.emit("player-update")

        if(j.name == "game-night") this.emit("night")
        if(j.name == "game-day") this.emit("day")
        if(j.name == "turn") this.emit("turn")
        if(j.name == "unturn") this.emit("unturn")

        if(j.name == "gameover" && !j.data) this.emit("game-lost")
        if(j.name == "gameover" && j.data) this.emit("game-won")
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

    public setName(name: string) {
        this.sendPacket("set-name", {name: name})
    }

    async getName(): Promise<string> {
        return await this.packetIO("get-name", {})
    }

    async createGame(): Promise<string> {
        return await this.packetIO("create-game", {})
    }

    async joinGame(id:string) {
        return await this.packetIO("join-game", {id: id})
    }

    async getPlayers(game_id:string) {
        return await this.packetIO("get-players", {id: game_id})
    }

    async isMod(game_id:string) {
        return await this.packetIO("is-mod", {id: game_id})
    }

    public startGame(game_id:string, amounts:{role:RoleName, amount:number}[]) {

        var role_amounts: {role: Role, amount: number}[] = []
        for(var r of amounts) {
            role_amounts.push({role: getRoleByRoleName(r.role), amount: r.amount})
        }

        this.sendPacket("start-game", {id: game_id, roles: role_amounts})
    }

    async canInteract(user_id:string) {
        return await this.packetIO("can-interact", {user_id:user_id, game_id:State.game.id})
    }

    public nextMove() {
        this.sendPacket("next-move", {id: State.game.id})
    }

    async seer(user_id: string): Promise<RoleName> {
        return await this.packetIO("execute-seer", {user_id: user_id, game_id: State.game.id})
    }

    async witch_get_prey() {
        return await this.packetIO("witch-get-prey", {game_id: State.game.id})
    }
    public witch_heal() {
        this.sendPacket("witch-heal-prey", {game_id: State.game.id})
    }
    public witch_kill(user_id: string) {
        this.sendPacket("witch-kill-other", {user_id: user_id, game_id: State.game.id})
    }
}

function getRoleByName(name: string): Role {
    return roles[roles.findIndex(e => e.name == name)].role
}

function getRoleByRoleName(name: RoleName): Role {
    //@ts-expect-error
    return roles[roles.findIndex(e => e.name == RoleName[name])].role
}
