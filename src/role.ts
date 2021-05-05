import { ActionMenu, Action, removeAllActionMenus } from "./client/framework/actionmenu"
import { Message, Urgency } from "./client/framework/message"
import { updatePlayer } from "./client/framework/screen/impl/gamescreen"
import { Player } from "./client/game/player"
import { State } from "./client/state"
import { Packet } from "./packet"
import { Game } from "./server/game/game"

export enum RoleName {
    WEREWOLF = "Werwolf",
    GIRL = "Mädchen",
    WITCH = "Hexe",
    SEER = "Seherin",
    AMOR = "Amor",
    MATTRESS = "Matratze",
    VILLAGER = "Dorfbewohner",
    HUNTER = "Jäger"
}

export function getNewRoleByRoleName(name: RoleName) {
    //@ts-expect-error
    switch (RoleName[name]) {
        case RoleName.WEREWOLF:
            return new Werewolf()
        case RoleName.GIRL:
            return new Girl()
        case RoleName.WITCH:
            return new Witch()
        case RoleName.SEER:
            return new Seer()
        case RoleName.AMOR:
            return new Amor()
        case RoleName.MATTRESS:
            return new Mattress()
        case RoleName.VILLAGER:
            return new Villager()
        case RoleName.HUNTER:
            return new Hunter()
    }

    switch (name) {
        case RoleName.WEREWOLF:
            return new Werewolf()
        case RoleName.GIRL:
            return new Girl()
        case RoleName.WITCH:
            return new Witch()
        case RoleName.SEER:
            return new Seer()
        case RoleName.AMOR:
            return new Amor()
        case RoleName.MATTRESS:
            return new Mattress()
        case RoleName.VILLAGER:
            return new Villager()
        case RoleName.HUNTER:
            return new Hunter()
    }
}

export abstract class Role {
    public name: RoleName
    constructor(name: RoleName) {
        this.name = name
    }
    public abstract on_interact(p: Player): void
    public abstract on_turn(): void

    public sendTurn(game: Game) {
        game.players.forEach(p => {
            if (p.role?.name == this.name && !p.dead) {
                p.ws.send(new Packet("your-turn").serialize())
                console.log(p.name)
            }
        })
    }
    public sendUnTurn(game: Game) {
        game.players.forEach(p => {
            if (p.role?.name == this.name && !p.dead) {
                p.ws.send(new Packet("turn-end").serialize())
            }
        })
    }
    public sendAll(game: Game, packet: Packet, include_dead: boolean = false) {
        game.players.forEach(p => {
            if (p.role?.name == this.name && (!p.dead || include_dead)) {
                p.ws.send(packet.serialize())
            }
        })
    }
}

export class Werewolf extends Role {
    constructor() {
        super(RoleName.WEREWOLF)
    }
    public on_interact(p: Player): void {
        new ActionMenu("Opfer auswählen", "Möchtest du " + p.name + " als Opfer auswählen? Wenn mehr als die Hälfte der anderen Werwölfe auch für dieses Opfer stimmen, stirbt dieses diese Nacht", false,
            {
                name: "Ja",
                onclick: () => { this.add_player_to_vote(p) }
            },
            {
                name: "Nein",
                onclick: () => { }
            }).show()
    }

    private add_player_to_vote(p: Player) {
        new Message("Du hast für " + p.name + " als Opfer gewählt.").display()
        State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: p.id }))
    }

    public on_turn(): void {
    }
}
export class Girl extends Role {
    private werewolf_fn: Werewolf
    constructor() {
        super(RoleName.GIRL)
        this.werewolf_fn = <Werewolf>getNewRoleByRoleName(RoleName.WEREWOLF)
    }
    public on_interact(p: Player): void {
        this.werewolf_fn.on_interact(p)
    }
    public on_turn(): void {
        this.werewolf_fn.on_turn()
    }
}
export class Witch extends Role {
    private able_heal: boolean = true
    private able_kill: boolean = true

    private prey_id?: string

    private heals_prey?: boolean

    private can_kill: boolean = false

    constructor() {
        super(RoleName.WITCH)
    }
    async on_interact(p: Player) {
        if (!this.can_kill) return

        new ActionMenu(p.name + " töten", "Möchtest du " + p.name + " wirklich töten?", false,
            {
                name: "Ja",
                onclick: () => {
                    this.can_kill = false
                    this.able_kill = false
                    removeAllActionMenus()
                    State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: this.heals_prey ? this.prey_id : "", sub_command: { kill: p.id } }))
                }
            },
            {
                name: "Nein",
                onclick: () => {
                    State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: "" }))
                }
            }).show()
    }

    async on_turn() {
        this.can_kill = false
        this.heals_prey = false

        if (this.able_heal) {

            this.prey_id = (await State.ws.sendAndRecvPacket(new Packet("witch-get-prey", { game_id: State.game.id }))).data
            var prey = State.game.players.find(e => e.id == this.prey_id)!
            new ActionMenu("Opfer heilen", "Das Opfer der Werwölfe ist " + prey.name + ". Möchtest du es heilen?", false,
                {
                    name: "Ja",
                    onclick: () => {
                        this.heals_prey = true
                        this.able_heal = false

                        if (this.able_kill) {
                            setTimeout(() => {
                                this.showKillActionMenu()
                            }, 500)
                        }
                    }
                },
                {
                    name: "Nein",
                    onclick: () => {
                        this.heals_prey = false
                        if (this.able_kill) {
                            setTimeout(() => {
                                this.showKillActionMenu()
                            }, 500)
                        }
                    }
                }).show()
        } else {
            if (this.able_kill) this.showKillActionMenu()
            else {
                new Message("Da du weder heilen, noch töten kannst, wirst du nun übersprungen").display()
                State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: "", sub_command: { kill: "" } }))
            }
        }
    }

    private showKillActionMenu() {
        this.can_kill = true
        var menu = new ActionMenu("Spieler töten", "Möchtest du einen Spieler töten? Wenn Ja, klicke auf diesen Spieler, wenn Nein, klicke auf \"Nein\"", false,
            {
                name: "Nein",
                onclick: () => {
                    State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: this.heals_prey ? this.prey_id : "", sub_command: { kill: "" } }))
                }
            })
        menu.stays_on_new = true
        menu.show()
    }
}
export class Seer extends Role {
    constructor() {
        super(RoleName.SEER)
    }
    async on_interact(p: Player) {
        var name = (await State.ws.sendAndRecvPacket(new Packet("seer-reveal-role", { game_id: State.game.id, target: p.id }))).data
        p.role = getNewRoleByRoleName(name)
        updatePlayer(p.id)
        new Message(p.name + " ist ein " + name, -1).display()
        removeAllActionMenus()
        State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: "" }))
    }
    public on_turn(): void {
        new ActionMenu("Identität erfahren", "Klicke auf den Spieler, von dem du die Identität erfahren möchtest. Klicke auf \"Keinem Spieler\", wenn du von niemandem die Identität erfahren möchtest oder bereits von allen die Identität erfahren hast.", false,
            {
                name: "Keinem Spieler",
                onclick: () => {
                    State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: "" }))
                }
            }).show()
    }
}
export class Amor extends Role {
    constructor() {
        super(RoleName.AMOR)
    }
    public on_interact(p: Player): void {

        var actions: Action[] = []
        State.game.players.forEach(players => {
            if (p == players) return
            actions.push({
                name: players.name,
                onclick: () => {
                    p.inLove = true
                    p.loves_id = players.loves_id
                    players.inLove = true
                    players.loves_id = p.loves_id
                    updatePlayer(p.id)
                    updatePlayer(players.id)

                    new Message("Du hast " + p.name + " mit " + players.name + " verliebt", -1).display()

                    State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: p.id, sub_command: players.id }))
                }
            })
        })

        new ActionMenu("Verliebte auswählen", "Wen möchtest du mit " + p.name + " verlieben?", false, ...actions).show()

    }
    public on_turn(): void {
    }
}
export class Mattress extends Role {
    private previous_sleeping_by: string = ""
    constructor() {
        super(RoleName.MATTRESS)
    }
    public on_interact(p: Player): void {
        if (this.previous_sleeping_by == p.id) {
            new Message("Du kannst bei " + p.name + " nicht schlafen, da du bereits bei diesem Spieler geschlafen hast.", 5000, Urgency.ERROR)
            return
        }
        removeAllActionMenus()
        new Message("Du schläfst diese Nacht bei " + p.name).display()
        this.previous_sleeping_by = p.id
        State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: p.id }))
    }
    public on_turn(): void {
        new ActionMenu("Schlafort auswählen", "Klicke auf den Spieler, bei dem du diese Nacht schlafen willst. Du kannst aber nicht zweimal hintereinander bei demselben Spieler schlafen. Bist du in dieser Nacht das Opfer, stirbst du nicht. Ist allerdings der Spieler das Opfer, bei dem du schläfst, so stirbst du auch. Wenn du bei niemandem schlafen willst, klicke auf \"Zuhause bleiben\"", false,
            {
                name: "Zuhause bleiben",
                onclick: () => {
                    State.ws.sendPacket(new Packet("player-perform-turn", { game_id: State.game.id, target_id: "" }))
                }
            }).show()
    }
}
export class Villager extends Role {
    constructor() {
        super(RoleName.VILLAGER)
    }
    public on_interact(p: Player): void {
    }
    public on_turn(): void {
    }
}
export class Hunter extends Role {
    constructor() {
        super(RoleName.HUNTER)
    }
    public on_interact(p: Player): void {
    }
    public on_turn(): void {
    }
}

function getPlayerDiv(p: Player) {
    return (<HTMLDivElement>document.getElementById("game-player-" + p.id))
}
