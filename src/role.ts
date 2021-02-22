export enum RoleName {
    WEREWOLF = "Werwolf",
    GIRL = "Mädchen",
    WITCH = "Hexe",
    SEER = "Sehering",
    AMOR = "Amor",
    MATTRESS = "Matratze",
    VILLAGER = "Dorfbewohner",
    HUNTER = "Jäger"
}

export abstract class Role {
    public name: RoleName
    constructor(name: RoleName) {
        this.name = name
    }
    public abstract on_interact(): void
    public abstract on_turn(): void
}
