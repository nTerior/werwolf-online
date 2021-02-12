import { State } from "./client/state"

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
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {

    }
}

export class Witch extends Role {
    constructor() {
        super(RoleName.WITCH)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
}

export class Hunter extends Role {
    constructor() {
        super(RoleName.HUNTER)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
}

export class Amor extends Role {
    constructor() {
        super(RoleName.AMOR)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
}

export class Girl extends Role {
    constructor() {
        super(RoleName.GIRL)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
}

export class Mattress extends Role {
    constructor() {
        super(RoleName.MATTRESS)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
}

export class Seer extends Role {
    constructor() {
        super(RoleName.SEER)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        if(State.game.selfplayer.secrets == undefined) State.game.selfplayer.secrets = {}
        State.game.selfplayer.secrets["seer-" + player.id] = await State.ws.seer(player.id)
        console.log(State.game.selfplayer.secrets["seer-" + player.id])
        State.ws.nextMove()
    }
}

export class Werwolf extends Role {
    constructor() {
        super(RoleName.WERWOLF)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
}

export const roles: {name: RoleName, role: Role}[] = [
    {
        name: RoleName.AMOR,
        role: new Amor()
    },
    {
        name: RoleName.MATTRESS,
        role: new Mattress()
    },
    {
        name: RoleName.WERWOLF,
        role: new Werwolf()
    },
    {
        name: RoleName.GIRL,
        role: new Girl()
    },
    {
        name: RoleName.WITCH,
        role: new Witch()
    },
    {
        name: RoleName.SEER,
        role: new Seer()
    },
    {
        name: RoleName.VILLAGER,
        role: new Villager()
    },
    {
        name: RoleName.HUNTER,
        role: new Hunter()
    }
]
