import { Settings } from "../../settings"
import { Player } from "./player"

export class Game {
    public id: string
    public players: Player[] = []
    public self_is_owner: boolean = false
    public settings?: Settings
    
    constructor(id: string) {
        this.id = id
    }

    public getSelfPlayer(): Player {
        return this.players.find(e => e.is_self)!
    }

    public getInviteLink(): string {
        return window.location.protocol + "//" + (window.location.host + window.location.pathname + "/" + this.id).replace("//", "/")
    }
}