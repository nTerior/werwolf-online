export enum RoleName {
    VILLAGER = "Dorfbewohner",
    WITCH = "Hexe",
    HUNTER = "Jäger",
    AMOR = "Amor",
    GIRL = "Mädchen",
    MATTRESS = "Matratze",
    SEER = "Seherin",

    WERWOLF = "Werwolf"
}

export enum NightTurns {
    AMOR = -1,
    LOVED,
    WERWOLF,
    WITCH,
    SEER
}

export abstract class Role {
    constructor(name:RoleName) {}
    public abstract on_turn(): boolean
}

export class Villager extends Role {
    constructor() {
        super(RoleName.VILLAGER)
    }
    public on_turn(): boolean {
        return false
    }
}
