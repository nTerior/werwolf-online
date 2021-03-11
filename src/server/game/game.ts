import { Player } from "./player"
import * as lws from "ws"
import { Packet } from "../../packet"
import { Settings } from "../../settings"
import { getNewRoleByRoleName, RoleName } from "../../role"
import { delay, getEnumKeyByEnumValue } from "../../utils"
import { EventEmitter } from "ws"

var games: Game[] = []

export class Game {
    public id: string
    public players: Player[] = []
    public owner_id: string
    public running: boolean = false
    public settings?: Settings

    public events: EventEmitter

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
        await this.roleTurnAndWait(RoleName.MATTRESS)
        await this.roleTurnAndWait(RoleName.WEREWOLF, RoleName.GIRL)
        await this.roleTurnAndWait(RoleName.WITCH)
        await this.roleTurnAndWait(RoleName.SEER)
        
        /*
        TODOS:
        winCheck: true => break look
        day
        winCheck: true => break look
        */
       
       await(this.gameRunnable())
    }

    private async roleTurnAndWait(...names: RoleName[]) {
        
        var tmp: boolean = false
        names.forEach(n => {
            if(this.settings?.settings.role_settings[n] != 0) tmp = true
        })
        if(!tmp) return

        names.forEach(n => {
            getNewRoleByRoleName((<RoleName>getEnumKeyByEnumValue(RoleName, n)))!.sendTurn(this)
        })

        await this.waitForTurnResponses(names)
        
        names.forEach(n => {
            getNewRoleByRoleName((<RoleName>getEnumKeyByEnumValue(RoleName, n)))!.sendUnTurn(this)
        })

        await delay(500)
    }
    
    private werewolf_target_list: string[] = []
    private werewolf_prey: string = ""

    private async waitForTurnResponses(roles: RoleName[]): Promise<void> {
        var players: Player[] = []

        var roles_sum: number = 0
        roles.forEach(r => {
            roles_sum += this.settings?.settings.role_settings[r]!
        })

        return new Promise(res => {
            this.events.on("player-perform-turn", (player_id, target_id, sub_command) => {
                var player: Player = this.getPlayer(player_id)!

                if(!roles.includes(player.role!.name)) return
                if(players.includes(player)) return

                // ==============================================
                
                // ROLE SPECIFIC STUFF
                // e.g. witches heal, etc.

                // ==============================================

                switch(player.role?.name) {
                    case RoleName.WEREWOLF:
                        this.werewolf_target_list.push(target_id)
                        player.role.sendAll(this, new Packet("recv-status-message", player.name + " hat für " + this.getPlayer(target_id)!.name + " als Opfer gestimmt."))
                        break
                }

                players.push(player)
                if(players.length == roles_sum) {
                    
                    // ==============================================
                
                    // OTHER ROLE SPECIFIC STUFF
                    // e.g. Werwolfes kill, etc.

                    // ==============================================

                    switch(player.role?.name) {
                        case RoleName.WEREWOLF:
                            this.werewolf_prey = maxCount(this.werewolf_target_list)
                            break
                    }
                 
                    res()
                }
            })
        })
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
        
        if(this.players.length == 0) {
            this.delete()
            return
        }
        
        this.owner_id = this.players[0].id
        var packet: Packet = new Packet("player-left", {
            id: player.id,
        })

        if(this.settings && player.role) {
            this.settings.settings.role_settings[player.role.name]!--
        }
        
        if(this.settings?.settings.reveal_role_death) {
            packet.data["role"] = player.role?.name
        }
        this.players.forEach(p => {
            packet.data["is_new_host"] = this.is_owner(p.id)
            p.ws.send(packet.serialize())
        })
        console.log(player.name + " left " + this.id)
        if(player.loves_id) {
            var loves = this.getPlayer(player.loves_id)!
            loves.loves_id = ""
            loves.inLove = false
        }
        if(player.undersleeper_id) this.getPlayer(player.undersleeper_id)!.sleeping_by = ""
        if(player.sleeping_by) this.getPlayer(player.sleeping_by)!.undersleeper_id = ""
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
        for(var role in this.settings!.settings.role_settings) {
            //@ts-expect-error
            var count = this.settings!.settings.role_settings[role]
            
            for(var i = 0; i < count; i++) {
                //@ts-expect-error
                this.players[currentPlayerIndex].role = getNewRoleByRoleName(getEnumKeyByEnumValue(RoleName, role))
                currentPlayerIndex++
            }
        }

        var werwolf_ids: string[] = []
        this.players.forEach(p => {
            if(p.role?.name == RoleName.WEREWOLF || p.role?.name == RoleName.GIRL) werwolf_ids.push(p.id)
        })

        this.players.forEach(p => {
            p.ws.send(new Packet("game-started", {role: p.role?.name, settings: this.settings}).serialize())
            if(p.role?.name == RoleName.WEREWOLF || p.role?.name == RoleName.GIRL) {
                p.ws.send(new Packet("werewolf-reveal", {ids: werwolf_ids}).serialize())
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
    for(var i = 0; i < 20; i++) {
        var item = possible[Math.floor(Math.random() * possible.length)];
        result += item
    }
    
    if(games.map(e => e.id).includes(result)) return generateGameId()
    return result
}

export function getGame(id: string): Game | undefined {
    return games.find(e => e.id == id)
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
