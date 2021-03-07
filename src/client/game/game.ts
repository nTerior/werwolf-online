import { RoleName } from "../../role"
import { Settings } from "../../settings"
import { Player } from "./player"

export class Game {
    public id: string
    public players: Player[] = []
    public self_is_owner: boolean = false
    public settings?: Settings
    public role_counts: {[k in RoleName]?: number} = {}
    
    constructor(id: string) {
        this.id = id
    }

    public getSelfPlayer(): Player {
        return this.players.find(e => e.is_self)!
    }

    public getInviteLink(): string {
        return window.location.protocol + "//" + window.location.host + "/" + this.id
    }
}