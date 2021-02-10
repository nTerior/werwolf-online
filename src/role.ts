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
    constructor(public name:RoleName) {}
    public abstract on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void;
    public getName(): string {
        //@ts-expect-error
        return RoleName[this.name]
    }
}

export class Villager extends Role {
    constructor() {
        super(RoleName.VILLAGER)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {}
}

export class Witch extends Role {
    constructor() {
        super(RoleName.WITCH)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {
        
    }
}

export class Hunter extends Role {
    constructor() {
        super(RoleName.HUNTER)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {
        
    }
}

export class Amor extends Role {
    constructor() {
        super(RoleName.AMOR)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {
        
    }
}

export class Girl extends Role {
    constructor() {
        super(RoleName.GIRL)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {
        
    }
}

export class Mattress extends Role {
    constructor() {
        super(RoleName.MATTRESS)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {
        
    }
}

export class Seer extends Role {
    constructor() {
        super(RoleName.SEER)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {
        
    }
}

export class Werwolf extends Role {
    constructor() {
        super(RoleName.WERWOLF)
    }
    public on_interact(player: {name: string, id: string, major:boolean, dead:boolean}): void {
        
    }
}

export const roles: {name: RoleName, role: Role}[] = [
    {
        name: RoleName.VILLAGER,
        role: new Villager()
    },
    {
        name: RoleName.WITCH,
        role: new Witch()
    },
    {
        name: RoleName.HUNTER,
        role: new Hunter()
    },
    {
        name: RoleName.GIRL,
        role: new Girl()
    },
    {
        name: RoleName.AMOR,
        role: new Amor()
    },
    {
        name: RoleName.MATTRESS,
        role: new Mattress()
    },
    {
        name: RoleName.SEER,
        role: new Seer()
    },
    {
        name: RoleName.WERWOLF,
        role: new Werwolf()
    }   
]
