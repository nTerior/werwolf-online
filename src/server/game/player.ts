import * as lws from "ws"
import { Packet } from "../../packet"
import { Role } from "../../role"
import { Game } from "./game"

export class Player {
    public name: string
    public id: string
    public ws: lws
    
    public role?: Role
    
    public dead: boolean = false
    public inLove: boolean = false
    public major: boolean = false

    public loves_id: string = ""
    public undersleeper_id: string = ""
    public sleeping_by: string = ""

    public witchCanHeal: boolean = true
    public witchCanKill: boolean = true

    public mattressSleepingBy: string = ""

    public game: Game

    constructor(name: string, id: string, ws: lws, game: Game) {
        this.name = name
        this.id = id
        this.ws = ws
        this.game = game
    }

    public killNight(ignore_love: boolean = false, ignore_sleeping: boolean = false) {
        if(this.sleeping_by && !ignore_sleeping) return
        console.log("Player " + this.name + " killed in night in game " + this.game.id)

        this.game.settings!.settings.role_settings[this.role!.name]!--
        this.ws.send(new Packet("you-died").serialize())

        this.game.players.forEach(p => {
            var data = {
                id: this.id, 
            }
            if(this.game.settings?.settings.reveal_role_death) {
                //@ts-expect-error
                data.role = this.role!.name
            }
            p.ws.send(new Packet("player-died", data).serialize())
        })
        
        this.dead = true
        if(this.undersleeper_id) {
            this.game.getPlayer(this.undersleeper_id)?.killNight(false, true)
        }

        if(ignore_love) return
        if(!this.loves_id) return
        this.game.getPlayer(this.loves_id)?.killNight(true, true)
    }
    
    public killDay(ignore_love: boolean = false) {
        console.log("Player " + this.name + " killed on day in game " + this.game.id)

        this.game.settings!.settings.role_settings[this.role!.name]!--
        this.ws.send(new Packet("you-died").serialize())

        this.dead = true
        if(ignore_love) return
        if(!this.loves_id) return
        this.game.getPlayer(this.loves_id)?.killDay(true)
    }
}
