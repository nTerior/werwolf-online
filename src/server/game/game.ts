import { Player } from "./player"
import * as lws from "ws"
import { Packet } from "../../packet"

var games: Game[] = []

export class Game {
    public id: string
    public players: Player[] = []
    public owner_id: string
    public running: boolean = false

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
        this.players.forEach(p => {
            p.ws.send(new Packet("player-left", {
                id: player.id
            }).serialize())
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
        this.owner_id = this.players[0].id
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
