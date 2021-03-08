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
}

export abstract class Role {
    public name: RoleName
    constructor(name: RoleName) {
        this.name = name
    }
    public abstract on_interact(): void
    public abstract on_turn(): void

    public sendTurn(game: Game) {
        game.players.forEach(p => {
            if(p.role?.name == this.name) {
                p.ws.send(new Packet("your-turn").serialize())
            }
        })
    }
    public sendUnTurn(game: Game) {
        game.players.forEach(p => {
            if(p.role?.name == this.name) {
                p.ws.send(new Packet("turn-end").serialize())
            }
        })
    }
}

export class Werewolf extends Role {
    constructor() {
        super(RoleName.WEREWOLF)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
export class Girl extends Role {
    constructor() {
        super(RoleName.GIRL)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
export class Witch extends Role {
    constructor() {
        super(RoleName.WITCH)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
export class Seer extends Role {
    constructor() {
        super(RoleName.SEER)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
export class Amor extends Role {
    constructor() {
        super(RoleName.AMOR)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
export class Mattress extends Role {
    constructor() {
        super(RoleName.MATTRESS)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
export class Villager extends Role {
    constructor() {
        super(RoleName.VILLAGER)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
export class Hunter extends Role {
    constructor() {
        super(RoleName.HUNTER)
    }
    public on_interact(): void {
    }
    public on_turn(): void {
    }
}
