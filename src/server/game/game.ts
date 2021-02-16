import { Role, RoleName, roles, Werwolf } from "../../role"
import * as lws from "ws"
import { WSPacket } from "../../wspacket"

interface Player {
    name: string,
    role?: Role,
    inLove?: boolean,
    ws: lws,
    id: string,
    major: boolean,
    dead: boolean,
    undersleeper_id?: string,
    is_sleeping?: boolean
}

export class Game {
    public players: Player[] = []
    public night: boolean = true
    public roles: {role: Role, amount:number}[] = []

    public currentRoleIndex = -1
    public currentRole:Role = roles[0].role
    public lastRole: RoleName = roles.find(e => e.name == RoleName.VILLAGER)!.role.name

    public prey_index:number = -1

    public running: boolean = true

    constructor(public id: string, public owner:string) {}

    private sendPlayerUpdate() {
        var packet: WSPacket = {
            name: "player-update",
            data: {},
            id: 189
        }
        this.players.forEach(player => {
            player.ws.send(JSON.stringify(packet))
        })
    }

    private nextRole() {
        if (this.currentRoleIndex == roles.length - 1) this.currentRoleIndex = 0
        else this.currentRoleIndex++
        this.currentRole = roles[this.currentRoleIndex].role
        var found = false
        for(var r of this.roles) {
            if(r.role.name == this.currentRole.name && r.amount != 0) found = true
        }
        if(!found) this.nextRole()
    }

    private possiblePreys: string[] = []
    public werwolfChoice(prey_id:string) {
        this.possiblePreys.push(prey_id)
        if(this.possiblePreys.length == this.roles.find(e => e.role.name == RoleName.WERWOLF)!.amount + this.roles.find(e => e.role.name == RoleName.GIRL)!.amount) {
            var id:string = maxCount(this.possiblePreys)
            this.prey_index = this.players.findIndex(e => e.id == id)
            this.possiblePreys = []
            this.moveDone()
        }
    }

    private killPlayerNight(id: string) {
        var player = this.getPlayer(id)
        if(player.is_sleeping) {
            if(player.undersleeper_id) {
                if(player.undersleeper_id != player.id) return
            }
        }
        //if(player.is_sleeping && player.undersleeper_id != player.id) return
        player.dead = true
        if(player.inLove) {
            player.inLove = false

            var loved = this.players.find(e => e.inLove)!
            loved.inLove = false
            this.killPlayerNight(loved.id)
        }
        
        if(player.undersleeper_id) {
            this.killPlayerNight(player.undersleeper_id)
        }
        this.roles.find(e => e.role.name == player.role!.name)!.amount--

        if(player.role!.name == RoleName.HUNTER) {
            this.hunterId = player.id
            this.killedHunter = true
        }
    }

    private killPlayerDay(id: string) {
        var player = this.getPlayer(id)
        player.dead = true
        if(player.inLove) {
            player.inLove = false

            var loved = this.players.find(e => e.inLove)!
            loved.inLove = false
            this.killPlayerDay(loved.id)
        }
        this.roles.find(e => e.role.name == player.role!.name)!.amount--

        if(player.role!.name == RoleName.HUNTER) {
            this.killedHunter = true
        }
    }

    private dayPreys: string[] = []
    public dayVote(voted_id: string) {
        this.dayPreys.push(voted_id)

        if(this.dayPreys.length == this.players.filter(e => !e.dead).length) {
            var id:string = maxCount(this.dayPreys)
            this.dayPreys = []
            
            this.killPlayerDay(id)
            var dead_packet: WSPacket = {
                name: "you-died",
                id: 21125365864342,
                data: {}
            }
            this.players.forEach(player => {
                if(player.dead) player.ws.send(JSON.stringify(dead_packet))
            })

            if(!this.killedHunter) {
                this.sendPlayerUpdate()
                setTimeout(() => {
                    this.sendGameOver(this.checkGameOver())
                    this.moveDone()
                }, 1000)
            } else {
                var player: Player = this.getPlayer(id)
                var can_kill_packet: WSPacket = {
                    name: "hunter-can-kill-day",
                    id: 890,
                    data: {}
                }
                player.ws.send(JSON.stringify(can_kill_packet))
                this.killedHunter = false
            }
        }
    }

    public hunterDoneAfterDay(id: string) {
        this.killPlayerDay(id)
        
        setTimeout(() => {
            var dead_packet: WSPacket = {
                name: "you-died",
                id: 21125365864342,
                data: {}
            }
            this.players.forEach(player => {
                if(player.dead) player.ws.send(JSON.stringify(dead_packet))
            })
            this.sendPlayerUpdate()
            this.sendGameOver(this.checkGameOver())
            this.moveDone()
        }, 1000)
    }

    public hunterDoneAfterNight(id: string) {
        this.killPlayerDay(id)

        var dead_packet: WSPacket = {
            name: "you-died",
            id: 21125365864342,
            data: {}
        }
        this.players.forEach(player => {
            if(player.dead) player.ws.send(JSON.stringify(dead_packet))
        })
        this.setDay()
        this.sendPlayerUpdate()
        this.currentRoleIndex = 0
        this.nextMoveDay = false
        this.sendGameOver(this.checkGameOver())
    }

    private killedHunter: boolean = false
    private hunterId: string = ""
    private nextMoveDay: boolean = false
    private nextMove() {
        if(this.nextMoveDay) {

            if(this.prey_index != -1) {
                this.killPlayerNight(this.players[this.prey_index].id)
                this.prey_index = -1
            }

            for(var i = 0; i < this.preys.length; i++) {
                this.killPlayerNight(this.preys[i].id)
            }
            
            this.lastRole = this.getLastRole()

            var dead_packet: WSPacket = {
                name: "you-died",
                id: 21125365864342,
                data: {}
            }
            this.players.forEach(player => {
                if(player.dead) player.ws.send(JSON.stringify(dead_packet))
            })

            if(!this.killedHunter) {
                this.setDay()
                this.sendPlayerUpdate()
                this.currentRoleIndex = 0
                this.nextMoveDay = false
                this.sendGameOver(this.checkGameOver())
            } else {
                var player: Player = this.getPlayer(this.hunterId)
                var can_kill_packet: WSPacket = {
                    name: "hunter-can-kill-night",
                    id: 891,
                    data: {}
                }
                player.ws.send(JSON.stringify(can_kill_packet))
                this.killedHunter = false
            }
            return
        }
        if(this.currentRole.name == RoleName.WERWOLF) {
            this.roleTurn(this.currentRole)
            this.roleTurn(roles.find(e => e.name == RoleName.GIRL)!.role)
            this.currentRoleIndex++
        } else if (this.currentRole.name == this.lastRole) {
            this.roleTurn(this.currentRole)
            this.nextMoveDay = true
        } else {
            this.roleTurn(this.currentRole)
        }
    }

    private sendGameOver(result: boolean | RoleName) {
        if(!result) return
        if(result == RoleName.WERWOLF) {
            this.players.forEach(p => {
                var packet: WSPacket = {
                    name: "gameover",
                    id: 183468,
                    data: {}
                }
                if(p.role?.name == RoleName.WERWOLF) packet.data = true
                else packet.data = false
                p.ws.send(JSON.stringify(packet))
            })
        } else if(result == RoleName.AMOR) {
            this.players.forEach(p => {
                var packet: WSPacket = {
                    name: "gameover",
                    id: 183468,
                    data: {}
                }
                if(p.inLove) packet.data = true
                else packet.data = false
                p.ws.send(JSON.stringify(packet))
            })
        } else if(result == true) {
            this.players.forEach(p => {
                var packet: WSPacket = {
                    name: "gameover",
                    id: 183468,
                    data: {}
                }
                if(p.role?.name != RoleName.WERWOLF) packet.data = true
                else packet.data = false
                p.ws.send(JSON.stringify(packet))
            })
        }
    }

    private checkGameOver(): RoleName | boolean {
        var werwolf_sum = 0
        var loved_sum = 0
        var total_sum = 0
        this.players.forEach(p => {
            if(p.role!.name == RoleName.WERWOLF && !p.dead) werwolf_sum++
            if(p.inLove && !p.dead) loved_sum++
            if(!p.dead) total_sum++
        })

        if(loved_sum == 2 && total_sum == 2) {
            this.running = false
            return RoleName.AMOR
        }
        if(werwolf_sum == total_sum) {
            this.running = false
            return RoleName.WERWOLF
        }
        if(werwolf_sum == 0) {
            this.running = false
            return true
        }
        return false
    }

    private preys: Player[] = []

    public kill(player_id: string) {
        var player = this.getPlayer(player_id)
        this.preys.push(player)
    }

    public getLastRole(skip_h:boolean = false, skip_v: boolean = false): RoleName {
        if(!skip_v) if(this.roles.find(r => r.role.name == RoleName.VILLAGER)!.amount != 0) return this.getLastRole(false, true)
        if(!skip_h) if(this.roles.find(r => r.role.name == RoleName.HUNTER)!.amount != 0) return this.getLastRole(true, true)
        if(this.roles.find(r => r.role.name == RoleName.SEER)!.amount != 0) return RoleName.SEER
        if(this.roles.find(r => r.role.name == RoleName.WITCH)!.amount != 0) return RoleName.WITCH
        if(this.roles.find(r => r.role.name == RoleName.GIRL)!.amount != 0) return RoleName.GIRL
        if(this.roles.find(r => r.role.name == RoleName.WERWOLF)!.amount != 0) return RoleName.WERWOLF
        if(this.roles.find(r => r.role.name == RoleName.MATTRESS)!.amount != 0) return RoleName.MATTRESS
        return RoleName.AMOR
    }

    public moveDone() {
        if(!this.running) return
        this.roleUnturn()
        this.nextRole()
        this.nextMove()
    }

    private roleTurn(role: Role) {
        var packet: WSPacket = {
            name: "turn",
            id: 126,
            data: {}
        }
        this.night = true
        this.players.forEach(player => {
            if(player.role!.name != role.name || player.dead) return
            player.ws.send(JSON.stringify(packet))
        })
    }

    private roleUnturn() {
        var packet: WSPacket = {
            name: "unturn",
            id: 126,
            data: {}
        }
        if(this.currentRole.name == RoleName.VILLAGER) packet.name = "game-night"
        this.players.forEach(player => {
            if(this.currentRole.name == player.role!.name || !this.night) player.ws.send(JSON.stringify(packet))
        })
        this.night = true
    }

    public start() {
        this.setRoles()
        this.transmitRoles()
        this.setNight()
        this.lastRole = this.getLastRole()
        setTimeout(() => this.moveDone(), 1000)
    }

    private setNight() {
        this.night = true
        var packet: WSPacket = {
            name: "game-night",
            id: 11,
            data: {}
        }
        this.players.forEach(player => {
            player.ws.send(JSON.stringify(packet))
        });
    }

    private setDay() {
        this.night = false
        var packet: WSPacket = {
            name: "game-day",
            id: 11,
            data: {}
        }
        this.players.forEach(player => {
            player.is_sleeping = undefined
            player.undersleeper_id = undefined
            player.ws.send(JSON.stringify(packet))
        });
    }

    private transmitRoles() {
        this.players.forEach(player => {
            var packet: WSPacket = {
                name: "role-reveal",
                id: 10,
                data: {
                    "role": player.role
                }
            }
            console.log(player.role)
            player.ws.send(JSON.stringify(packet))
        });

        this.players.forEach(player => {
            this.players.forEach(p2 => {
                if(player.id != p2.id) {
                    if((player.role!.name == RoleName.WERWOLF || player.role!.name == RoleName.GIRL) && (p2.role!.name == RoleName.WERWOLF || p2.role!.name == RoleName.GIRL)) {
                        var packet: WSPacket = {
                            name: "werwolf-reveal",
                            id: 238749,
                            data: p2.id
                        }
                        player.ws.send(JSON.stringify(packet))
                    }
                }
            })
        })

    }

    private setRoles() {
        this.players = this.shufflePlayers()
        
        var i = 0
        for(var role of this.roles) {
            for(var next = 0; next < role.amount; next++) {
                this.players[i].role = role.role
                i++
            }
        }
    }

    private shufflePlayers() {
        var j, x, i;
        for (i = this.players.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = this.players[i];
            this.players[i] = this.players[j];
            this.players[j] = x;
        }
        return this.players;
    }

    public getLink(): string {
        return createGameLink(this.id)
    }

    public getPlayer(id:string): Player {
        return this.players[this.players.findIndex(e => e.id == id)]!
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
        major: false,
        dead: false
    }
    game.players.push(player)
    return true
}

export function removePlayer(gameid:string, ws:lws) {
    var game = getGame(gameid)
    if(game == undefined) return false
    var pi: number = game.players.findIndex(e => e.ws == ws)
    var p: Player = game.players[pi]
    game.players.splice(pi, 1)

    if(p.role != undefined) {
        game.roles.find(e => e.role.name == p.role?.name)!.amount--;
        game.lastRole = game.getLastRole()
    }
    return true
}

function maxCount(array:any[]) {
    if(array.length == 0)
        return null;
    var modeMap:any = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++) {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

function createGameLink(id: string): string {
    return window.location.host + "?game=" + id
}

function createId() {
    return Math.random().toString(36).substr(2, 12);
}
