import { Role } from "../../role"
import { State } from "../state"

interface SelfPlayer {
    name: string,
    role?: Role,
    in_love?: boolean,
    major:boolean
}

export class Game {
    public players: {name: string, id: string, major:boolean, dead: boolean}[] = []
    constructor(public id:string, public selfplayer: SelfPlayer) {}

    async updatePlayers() {
        this.players = await State.ws.getPlayers(this.id)
    }

    public getLink(): string {
        return window.location.host + "?game=" + this.id
    }
}