export enum RoleName {
    WEREWOLF = "Werwolf",
    GRIL = "Mädchen",
    WITCH = "Hexe",
    SEER = "Sehering",
    AMOR = "Amor",
    MATTRESS = "Matratze",
    VILLAGER = "Dorfbewohner",
    HUNTER = "Jäger",

    NONE = "None"
}

export abstract class Role {
    public name: RoleName
    constructor(name: RoleName) {
        this.name = name
    }
    public abstract on_interact(): void
    public abstract on_turn(): void
}

export class RoleNone extends Role {
    constructor() {super(RoleName.NONE)}
    public on_interact(): void {
        throw new Error("Role was still there")
    }
    public on_turn(): void {
        throw new Error("Role was still there")
    }
}
