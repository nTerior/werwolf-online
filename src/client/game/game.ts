import { Role } from "../../role"

interface Player {
    name: string
}

interface SelfPlayer {
    name: string,
    role?: Role,
    in_love?: boolean
}

export class Game {
    public players: Player[] = []
    constructor(public id:string, public selfplayer: SelfPlayer) {}
    public getLink(): string {
        return window.location.host + "?game=" + this.id
    }
}