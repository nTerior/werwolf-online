import * as lws from "ws"
import { Role, RoleNone } from "../../role"
import { Game } from "./game"

export class Player {
    public name: string
    public id: string
    public ws: lws
    
    public role: Role = new RoleNone()
    
    public dead: boolean = false
    public inLove: boolean = false
    public major: boolean = false

    public loves_id: string = ""
    public undersleeper_id: string = ""
    public sleeping_by: string = ""

    public game: Game

    constructor(name: string, id: string, ws: lws, game: Game) {
        this.name = name
        this.id = id
        this.ws = ws
        this.game = game
    }

    public killNight(ignore_love: boolean = false) {
        console.log("Player " + this.name + " killed in night in game " + this.game.id)
        if(this.sleeping_by) return
        this.dead = true
        
        if(this.undersleeper_id) this.game.getPlayer(this.undersleeper_id)?.killNight()

        if(ignore_love) return
        if(!this.loves_id) return
        this.game.getPlayer(this.loves_id)?.killNight(true)
    }

    public killDay(ignore_love: boolean = false) {
        console.log("Player " + this.name + " killed on day in game " + this.game.id)
        this.dead = true
        if(ignore_love) return
        if(!this.loves_id) return
        this.game.getPlayer(this.loves_id)?.killDay(true)
    }
}
