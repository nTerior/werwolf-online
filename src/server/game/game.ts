import { Player } from "./player"
import * as lws from "ws"

var games: Game[] = []

export class Game {
    public id: string
    public players: Player[] = []

    constructor() {
        this.id = generateGameId()
    }

    public addPlayer(name: string, id: string, ws: lws) {
        this.players.push(new Player(name, id, ws, this))
    }

    public getPlayer(id: string): Player | undefined {
        return this.players.find(p => p.id == id)
    }

    public shufflePlayers() {
        this.players.sort(() => Math.random() - 0.5)
    }

    public delete(): void {
        games.splice(games.findIndex(e => e === this), 1)
    }

    public static createGame(): Game {
        var game = new Game()
        games.push(game)
        return game
    }
}

function generateGameId() {
    const possible = "ABDEFGHAIKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
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
