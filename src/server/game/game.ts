import { Player } from "./player"
import * as lws from "ws"
import { Packet } from "../../packet"
import { Settings } from "../../settings"
import { getNewRoleByRoleName, Role, RoleName } from "../../role"
import { delay, getEnumKeyByEnumValue } from "../../utils"
import { EventEmitter } from "ws"

var games: Game[] = []

const won_werewolves = 1
const won_villagers = 2
const won_loved = 3

export class Game {
    public id: string
    public players: Player[] = []
    public owner_id: string
    public running: boolean = false
    public settings?: Settings

    public events: EventEmitter

    private round: number = 0

    public majorSuggestions: string[] = []

    constructor(owner_id: string) {
        this.id = generateGameId()
        this.owner_id = owner_id
        games.push(this)
        this.events = new EventEmitter()
    }

    private async startGameRunnable() {
        await this.roleTurnAndWait(RoleName.AMOR)
        await this.gameRunnable()
    }

    private async gameRunnable() {
        this.round++
        await this.roleTurnAndWait(RoleName.MATTRESS)
        await this.roleTurnAndWait(RoleName.WEREWOLF, RoleName.GIRL)
        await this.roleTurnAndWait(RoleName.WITCH)
        await this.roleTurnAndWait(RoleName.SEER)

        await this.setDay()
        if (this.endGame()) return

        var majorIsLiving: boolean | undefined = !this.players.find(p => p.major)?.dead

        if (this.round == 1 || majorIsLiving == false || majorIsLiving == undefined) {
            await this.majorVoteAndWait()
        }

        await this.dayVoteAndWait()

        if (this.endGame()) return

        this.setNight()
        await (this.gameRunnable())
    }

    private endGame() {
        var won: number = this.checkWon()
        if (!won) return false

        this.players.forEach(p => {
            if (won != -1)
                p.ws.send(new Packet("recv-status-message", { msg: "Die " + (won == won_loved ? "Verliebten" : won == won_villagers ? "Dorfbewohner" : "Werwölfe") + " haben gewonnen!", dur: -1 }).serialize())
            else
                p.ws.send(new Packet("recv-status-message", { msg: "Unentschieden!", dur: -1 }).serialize())

            var packet: Packet = new Packet("game-lost")
            if (p.role!.name == RoleName.WEREWOLF && won == won_werewolves) {
                packet.name = "game-won"
            } else if (p.role!.name != RoleName.WEREWOLF && won == won_villagers) {
                packet.name = "game-won"
            } else if (p.inLove && won == won_loved) {
                packet.name = "game-won"
            } else if (won == -1) {
                packet.name = "game-tie"
            }

            p.ws.send(packet.serialize())
        })

        return true
    }

    private checkWon(): number {
        var livingPlayers: number = 0;

        var werewolves: number = 0;
        var loved: number = 0;
        var villagers: number = 0;

        this.players.forEach(p => {
            if (p.dead) return
            livingPlayers++

            if (p.inLove) loved++

            if (p.role!.name == RoleName.WEREWOLF) werewolves++
            else villagers++
        })

        if (loved && livingPlayers == 2) return won_loved
        if (werewolves && !villagers) return won_werewolves
        if (villagers && !werewolves) return won_villagers

        if (livingPlayers == 0) return -1
        return 0
    }

    private async dayVoteAndWait() {
        this.players.forEach(p => {
            if (p.dead) return
            p.ws.send(new Packet("dayVote").serialize())
        })
        await this.waitForDayVotes()
    }

    public dayVoteSuggestions: Player[] = []
    private async waitForDayVotes(): Promise<void> {
        var voted: Player[] = []
        var votes: Player[] = []

        await new Promise<void>(res => {
            this.events.on("playerVoteDay", async (player, vote) => {
                if (voted.includes(player)) return
                if (player.dead) return

                voted.push(player)

                var target: Player = this.getPlayer(vote)!
                votes.push(target)

                this.players.forEach(p => {
                    p.ws.send(new Packet("recv-status-message", player.name + " hat für " + target.name + " gestimmt.").serialize())
                })

                var votes_sum: number = 0
                this.players.forEach(p => {
                    if (p.dead) return
                    votes_sum++
                })

                if (voted.length == votes_sum) {
                    var possible_kills: Player[] = getAllMax(votes)

                    if (possible_kills.length == 1) {
                        this.players.forEach(p => {
                            p.ws.send(new Packet("recv-status-message", possible_kills[0].name + " wird nun hingerichtet.").serialize())
                        })
                        possible_kills[0].killDay()
                    } else {

                        var major: Player = this.players[0]
                        this.players.forEach(p => {
                            if (p.major && !p.dead) major = p
                        })

                        this.players.forEach(p => {
                            p.ws.send(new Packet("recv-status-message", major.name + " darf nun entscheiden, wer stirbt.").serialize())
                        })

                        major.ws.send(new Packet("majorUse", { targets: possible_kills.map(e => e.id) }).serialize())
                        await new Promise<void>(res => {
                            this.events.on("majorExecution", target => {
                                var killing: Player = this.getPlayer(target)!
                                killing.killDay()
                                res()
                            })
                        })
                    }
                    res()
                }

            })
        })
        this.events.removeAllListeners("playerVoteDay")
    }

    private async majorVoteAndWait() {
        this.players.forEach(p => {
            if (p.dead) return
            p.ws.send(new Packet("majorVote").serialize())
        })
        await this.waitForMajorVotes()
    }

    public majorVotes: string[] = []
    private async waitForMajorVotes(): Promise<void> {
        var voted: Player[] = []

        await new Promise<void>(res => {
            this.events.on("playerVoteMajor", (player, vote) => {
                if (voted.includes(player)) return
                if (player.dead) return

                voted.push(player)
                this.majorVotes.push(vote)

                this.players.forEach(p => {
                    p.ws.send(new Packet("recv-status-message", player.name + " hat für " + this.getPlayer(vote)!.name + " als Bürgermeister gestimmt.").serialize())
                })

                var votes_sum: number = 0
                this.players.forEach(p => {
                    if (p.dead) return
                    votes_sum++
                })

                if (voted.length == votes_sum) {
                    var major: Player = this.getPlayer(maxCount(this.majorVotes))!
                    major.major = true
                    major.ws.send(new Packet("selfMajorReveal").serialize())
                    this.players.forEach(p => {
                        if (p == major) return
                        p.ws.send(new Packet("majorReveal", major.id).serialize())
                    })
                    res()
                }

            })
        })
        this.events.removeAllListeners("playerVoteMajor")
    }

    public roles_turn: RoleName[] = []

    private async roleTurnAndWait(...names: RoleName[]) {

        this.roles_turn = names
        var tmp: boolean = false
        names.forEach(n => {
            if (this.settings?.settings.role_settings[n] != 0) tmp = true
        })
        if (!tmp) return
        console.log(...names)

        names.forEach(n => {
            getNewRoleByRoleName((<RoleName>getEnumKeyByEnumValue(RoleName, n)))!.sendTurn(this)
        })

        await this.waitForTurnResponses(names)

        names.forEach(n => {
            getNewRoleByRoleName((<RoleName>getEnumKeyByEnumValue(RoleName, n)))!.sendUnTurn(this)
        })

        await delay(500)
    }

    async setDay() {
        this.majorSuggestions = []
        this.majorVotes = []
        this.roles_turn = []
        this.werewolf_target_list = []

        if (this.werewolf_prey) {
            await this.getPlayer(this.werewolf_prey)?.killNight()
        }
        if (this.witch_prey) await this.getPlayer(this.witch_prey)?.killNight()

        this.werewolf_prey = ""
        this.witch_prey = ""

        this.players.forEach(p => {
            p.sleeping_by = ""
            p.undersleeper_id = ""
            if (!p.dead) p.ws.send(new Packet("daytime").serialize())
        })
    }

    private setNight() {
        this.players.forEach(p => {
            if (p.dead) return
            p.ws.send(new Packet("nighttime").serialize())
        })
    }

    private werewolf_target_list: string[] = []
    public werewolf_prey: string = ""

    private witch_prey: string = ""

    private async waitForTurnResponses(roles: RoleName[]): Promise<void> {
        var players: Player[] = []

        await new Promise<void>(res => {
            this.events.on("player-perform-turn", (player_id, target_id, sub_command) => {
                var player: Player = this.getPlayer(player_id)!

                if (!roles.includes(player.role!.name)) return
                if (players.includes(player)) return
                if (player.dead) return

                // ==============================================

                // ROLE SPECIFIC STUFF
                // e.g. witches heal, etc.

                // ==============================================

                switch (player.role?.name) {
                    case RoleName.WEREWOLF: case RoleName.GIRL:
                        this.werewolf_target_list.push(target_id)
                        getNewRoleByRoleName(RoleName.GIRL).sendAll(this, new Packet("recv-status-message", player.name + " hat für " + this.getPlayer(target_id)!.name + " als Opfer gestimmt."))
                        getNewRoleByRoleName(RoleName.WEREWOLF).sendAll(this, new Packet("recv-status-message", player.name + " hat für " + this.getPlayer(target_id)!.name + " als Opfer gestimmt."))
                        break
                    case RoleName.AMOR:
                        var p1: Player = this.getPlayer(target_id)!
                        var p2: Player = this.getPlayer(sub_command)!
                        p1.loves_id = p2.id
                        p2.loves_id = p1.id
                        p1.inLove = true
                        p2.inLove = true
                        p1.ws.send(new Packet("love-reveal", { id: p2.id, role: p2.role?.name }).serialize())
                        p2.ws.send(new Packet("love-reveal", { id: p1.id, role: p1.role?.name }).serialize())
                        break
                    case RoleName.WITCH:
                        if (target_id != "" && player.witchCanHeal) {
                            this.werewolf_prey = ""
                            player.witchCanHeal = false
                        }
                        if (sub_command.kill != "" && player.witchCanKill) {
                            this.witch_prey = sub_command.kill
                            player.witchCanKill = false
                        }
                        break
                    case RoleName.MATTRESS:
                        if (target_id == "") break
                        var target: Player = this.getPlayer(target_id)!

                        if (player.mattressSleepingBy == target.id) break

                        player.sleeping_by = target.id
                        player.mattressSleepingBy = target.id

                        target.undersleeper_id = player.id
                        break
                }

                var roles_sum: number = 0
                roles.forEach(r => {
                    roles_sum += this.settings?.settings.role_settings[r]!
                })

                players.push(player)
                if (players.length == roles_sum) {

                    // ==============================================

                    // OTHER ROLE SPECIFIC STUFF
                    // e.g. Werwolfes kill, etc.

                    // ==============================================

                    switch (player.role?.name) {
                        case RoleName.WEREWOLF: case RoleName.GIRL:
                            this.werewolf_prey = maxCount(this.werewolf_target_list)
                            break
                    }

                    res()
                }
            })
        })
        this.events.removeAllListeners("player-perform-turn")
    }

    public addPlayer(name: string, id: string, ws: lws) {
        console.log(name + " joined " + this.id)
        var newPlayer = new Player(name, id, ws, this)
        this.players.forEach(player => {
            player.ws.send(new Packet("player-joined", {
                name: newPlayer.name,
                id: newPlayer.id
            }).serialize())
        })
        this.players.push(newPlayer)
    }

    public removePlayer(id: string) {
        var player: Player = this.players.splice(this.players.findIndex(e => e.id == id), 1)[0]

        if (this.players.length == 0) {
            this.delete()
            return
        }

        this.owner_id = this.players[0].id
        var packet: Packet = new Packet("player-left", {
            id: player.id,
        })

        if (this.settings && player.role) {
            if (!player.dead)
                this.settings.settings.role_settings[player.role.name]!--
        }

        if (this.settings?.settings.reveal_role_death) {
            packet.data["role"] = player.role?.name
        }
        this.players.forEach(p => {
            packet.data["is_new_host"] = this.is_owner(p.id)
            p.ws.send(packet.serialize())
        })
        console.log(player.name + " left " + this.id)
        if (player.loves_id) {
            var loves = this.getPlayer(player.loves_id)!
            loves.loves_id = ""
            loves.inLove = false
        }
        if (player.undersleeper_id) this.getPlayer(player.undersleeper_id)!.sleeping_by = ""
        if (player.sleeping_by) this.getPlayer(player.sleeping_by)!.undersleeper_id = ""
    }

    public checkName(name: string) {
        var player = this.players.find(e => e.name.toLowerCase() == name.toLowerCase())
        return player ? false : true
    }

    public getPlayer(id: string): Player | undefined {
        return this.players.find(p => p.id == id)
    }

    public shufflePlayers() {
        this.players.sort(() => Math.random() - 0.5)
    }

    public delete(): void {
        console.log("Game deleted: " + this.id)
        games.splice(games.findIndex(e => e === this), 1)
    }

    public is_owner(id: string): boolean {
        return this.owner_id == id
    }

    public start(): void {
        console.log("Game started: " + this.id)
        this.running = true

        // Shuffling the players
        this.players = this.players.sort((a, b) => 0.5 - Math.random())
        this.players = this.players.sort((a, b) => 0.5 - Math.random())
        this.players = this.players.sort((a, b) => 0.5 - Math.random())

        // Setting the roles
        var currentPlayerIndex = 0;
        for (var role in this.settings!.settings.role_settings) {
            //@ts-expect-error
            var count = this.settings!.settings.role_settings[role]

            for (var i = 0; i < count; i++) {
                //@ts-expect-error
                this.players[currentPlayerIndex].role = getNewRoleByRoleName(getEnumKeyByEnumValue(RoleName, role))
                currentPlayerIndex++
            }
        }

        var werwolf_ids: string[] = []
        this.players.forEach(p => {
            if (p.role?.name == RoleName.WEREWOLF || p.role?.name == RoleName.GIRL) werwolf_ids.push(p.id)
        })

        this.players.forEach(p => {
            p.ws.send(new Packet("game-started", { role: p.role?.name, settings: this.settings }).serialize())
            if (p.role?.name == RoleName.WEREWOLF || p.role?.name == RoleName.GIRL) {
                p.ws.send(new Packet("werewolf-reveal", { ids: werwolf_ids }).serialize())
            }
        })

        setTimeout(async () => {
            await this.startGameRunnable()
        }, 2000)
    }
}

function generateGameId(): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    var result = ""
    for (var i = 0; i < 5; i++) {
        var item = possible[Math.floor(Math.random() * possible.length)];
        result += item
    }

    if (games.map(e => e.id).includes(result)) return generateGameId()
    return result
}

export function getGame(id: string): Game | undefined {
    return games.find(e => e.id == id)
}

function maxCount(array: any[]) {
    if (array.length == 0)
        return null;
    var modeMap: any = {};
    var maxEl = array[0], maxCount = 1;
    for (var i = 0; i < array.length; i++) {
        var el = array[i];
        if (modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

function count(el: any, array: any[]) {
    return array.filter(e => e == el).length
}

function getAllMax(array: any[]): any[] {
    var max = maxCount(array)
    var max_count = count(max, array)

    var maxes: any[] = []

    array.forEach(a => {
        if (count(a, array) == max_count && !maxes.includes(a)) maxes.push(a)
    })
    return maxes
}
