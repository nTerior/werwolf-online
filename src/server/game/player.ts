import * as lws from "ws"
import { Packet } from "../../packet"
import { Role, RoleName } from "../../role"
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

    async killNight(ignore_love: boolean = false, ignore_sleeping: boolean = false) {
        if (this.sleeping_by && !ignore_sleeping) return

        if (this.role!.name == RoleName.HUNTER) {
            this.ws.send(new Packet("activate-hunter").serialize())
            await new Promise<void>(res => {

                this.game.events.on("hunter-perform-kill", target_id => {
                    if (target_id == undefined) {
                        res()
                        return
                    }

                    this.game.getPlayer(target_id)?.killDay()
                    res()
                })
            })
        }

        console.log("Player " + this.name + " killed in night in game " + this.game.id)

        this.game.settings!.settings.role_settings[this.role!.name]!--
        this.ws.send(new Packet("you-died").serialize())

        var data = {
            id: this.id,
        }
        if (this.game.settings?.settings.reveal_role_death) {
            //@ts-expect-error
            data.role = this.role!.name
        }
        this.game.players.forEach(p => {
            p.ws.send(new Packet("player-died", data).serialize())
        })

        this.dead = true
        if (this.undersleeper_id) {
            this.game.getPlayer(this.undersleeper_id)?.killNight(false, true)
        }

        if (ignore_love) return
        if (!this.loves_id) return
        this.game.getPlayer(this.loves_id)?.killNight(true, true)
        this.major = false
    }

    async killDay(ignore_love: boolean = false) {
        console.log("Player " + this.name + " killed on day in game " + this.game.id)

        this.game.settings!.settings.role_settings[this.role!.name]!--
        this.ws.send(new Packet("you-died").serialize())

        var data = {
            id: this.id,
        }
        if (this.game.settings?.settings.reveal_role_death) {
            //@ts-expect-error
            data.role = this.role!.name
        }
        this.game.players.forEach(p => {
            p.ws.send(new Packet("player-died", data).serialize())
        })

        this.dead = true
        if (ignore_love) return
        if (!this.loves_id) return
        this.game.getPlayer(this.loves_id)?.killDay(true)
        this.major = false
    }
}
