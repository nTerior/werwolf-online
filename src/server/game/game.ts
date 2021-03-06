import { Player } from "./player"
import * as lws from "ws"
import { Packet } from "../../packet"
import { Settings } from "../../settings"
import { getNewRoleByRoleName, RoleName } from "../../role"
import { getEnumKeyByEnumValue } from "../../utils"

var games: Game[] = []

export class Game {
    public id: string
    public players: Player[] = []
    public owner_id: string
    public running: boolean = false
    public settings?: Settings

    constructor(owner_id: string) {
        this.id = generateGameId()
        this.owner_id = owner_id
        games.push(this)
    }

    public addPlayer(name: string, id: string, ws: lws) {
        console.log(name + " joined " + this.id)
        var newPlayer = new Player(name, id, ws, this)
        this.players.forEach(player => {
            player.ws.send(new Packet("player-joined", {
                name: newPlayer.name,
                id: newPlayer.id
            }).serialize())
        })
        this.players.push(newPlayer)
    }

    public removePlayer(id: string) {
        var player: Player = this.players.splice(this.players.findIndex(e => e.id == id), 1)[0]
        this.owner_id = this.players[0].id
        var packet: Packet = new Packet("player-left", {
            id: player.id,
        })
        if(this.settings?.settings.reveal_role_death) {
            packet.data["role"] = player.role?.name
        }
        this.players.forEach(p => {
            packet.data["is_new_host"] = this.is_owner(p.id)
            p.ws.send(packet.serialize())
        })
        console.log(player.name + " left " + this.id)
        if(this.players.length == 0) {
            this.delete()
            return
        }
        if(player.loves_id) {
            var loves = this.getPlayer(player.loves_id)!
            loves.loves_id = ""
            loves.inLove = false
        }
        if(player.undersleeper_id) this.getPlayer(player.undersleeper_id)!.sleeping_by = ""
        if(player.sleeping_by) this.getPlayer(player.sleeping_by)!.undersleeper_id = ""
    }

    public checkName(name: string) {
        var player = this.players.find(e => e.name.toLowerCase() == name.toLowerCase())
        return player ? false : true
    }

    public getPlayer(id: string): Player | undefined {
        return this.players.find(p => p.id == id)
    }

    public shufflePlayers() {
        this.players.sort(() => Math.random() - 0.5)
    }

    public delete(): void {
        console.log("Game deleted: " + this.id)
        games.splice(games.findIndex(e => e === this), 1)
    }

    public is_owner(id: string): boolean {
        return this.owner_id == id
    }

    public start(): void {
        console.log("Game started: " + this.id)
        this.running = true

        // Shuffling the players
        this.players = this.players.sort((a, b) => 0.5 - Math.random())
        this.players = this.players.sort((a, b) => 0.5 - Math.random())
        this.players = this.players.sort((a, b) => 0.5 - Math.random())

        // Setting the roles
        var currentPlayerIndex = 0;
        for(var role in this.settings!.settings.role_settings) {
            //@ts-expect-error
            var count = this.settings!.settings.role_settings[role]
            
            for(var i = 0; i < count; i++) {
                //@ts-expect-error
                this.players[currentPlayerIndex].role = getNewRoleByRoleName(getEnumKeyByEnumValue(RoleName, role))
                currentPlayerIndex++
            }
        }

        this.players.forEach(p => {
            p.ws.send(new Packet("game-started", {role: p.role?.name, settings: this.settings}).serialize())
        })
    }
}

function generateGameId() {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    var result = ""
    for(var i = 0; i < 20; i++) {
        var item = possible[Math.floor(Math.random() * possible.length)];
        result += item
    }
    return result
}

export function getGame(id: string): Game | undefined {
    return games.find(e => e.id == id)
}
