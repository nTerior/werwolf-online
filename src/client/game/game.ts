import { Player } from "./player"

export class Game {
    public id: string
    public players: Player[] = []
    public self_is_owner: boolean = false
    
    constructor(id: string) {
        this.id = id
    }

    public getInviteLink(): string {
        return window.location.protocol + "//" + (window.location.host + window.location.pathname + "/" + this.id).replace("//", "/")
    }
}