import { Role } from "../../role"
import * as lws from "ws"

interface Player {
    name: string,
    role?: Role,
    inLove?: boolean,
    ws: lws,
    id: string,
    major: boolean
}

export class Game {
    public players: Player[] = []
    public roles: {role: Role, amount:number}[] = []
    constructor(public id: string, public owner:string) {}
    public getLink(): string {
        return createGameLink(this.id)
    }
    public start() {
        
    }
}

var games: {id: string, game: Game}[] = []

export function getGame(id: string) {
    var index = games.findIndex(e => e.id == id)
    if(index == -1) return undefined
    return games[index].game
}

export function createGame(owner:string): Game {
    var id = createId()
    var game: Game = new Game(id, owner)
    games.push({id, game})
    return game
}

export function deleteGame(gameid:string) {
    games.splice(games.findIndex(e => e.id == gameid), 1)
}

export function addPlayer(gameid: string, name:string, ws:lws, id:string): boolean {
    var game = getGame(gameid)
    if(game == undefined) return false
    var player: Player = {
        name: name,
        ws: ws,
        id: id,
        major: false
    }
    game.players.push(player)
    return true
}

export function removePlayer(gameid:string, ws:lws) {
    var game = getGame(gameid)
    if(game == undefined) return false
    game.players.splice(game.players.findIndex(e => e.ws == ws), 1)
    return true
}

function createGameLink(id: string): string {
    return window.location.host + "?game=" + id
}

function createId() {
    return Math.random().toString(36).substr(2, 9);
}
