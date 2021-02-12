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
    public abstract on_turn(): void;
    public getName(): string {
        //@ts-expect-error
        return RoleName[this.name]
    }
}

export class Villager extends Role {
    constructor() {
        super(RoleName.VILLAGER)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {}
    public on_turn(): void {}
}

export class Witch extends Role {
    constructor() {
        super(RoleName.WITCH)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        var prey_id = State.game.selfplayer.secrets["current_prey"]
        if(prey_id == player.id && State.game.selfplayer.secrets["heal_potions"] == 1) {
            var name_element = <HTMLDivElement>document.getElementById("player-name-" + prey_id)
            name_element.textContent += " » Geheilt"

            State.ws.witch_heal()
            State.game.selfplayer.secrets["heal_potions"] = 0
        } else if(State.game.selfplayer.secrets["kill_potions"] == 1) {
            var name_element = <HTMLDivElement>document.getElementById("player-name-" + player.id)
            name_element.textContent += " » Getötet"
            State.ws.witch_kill(player.id)
            State.game.selfplayer.secrets["kill_potions"] = 0
        }
    }
    async on_turn() {
        (<HTMLButtonElement>document.getElementById("continue-button")).hidden = false
        var prey_id = await State.ws.witch_get_prey()
        if(State.game.selfplayer.secrets == undefined) State.game.selfplayer.secrets = {}
        State.game.selfplayer.secrets["current_prey"] = prey_id
        if(prey_id != -1) {
            console.log(prey_id)
            var name = <HTMLDivElement>document.getElementById("player-name-" + prey_id)
            if(name) name.textContent += " » Opfer"
        }
    }
}

export class Hunter extends Role {
    constructor() {
        super(RoleName.HUNTER)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
    public on_turn(): void {
        
    }
}

export class Amor extends Role {
    constructor() {
        super(RoleName.AMOR)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
    public on_turn(): void {
        
    }
}

export class Girl extends Role {
    constructor() {
        super(RoleName.GIRL)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
    public on_turn(): void {
        
    }
}

export class Mattress extends Role {
    constructor() {
        super(RoleName.MATTRESS)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
    public on_turn(): void {
        
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
    public on_turn(): void {
        
    }
}

export class Werwolf extends Role {
    constructor() {
        super(RoleName.WERWOLF)
    }
    async on_interact(player: {name: string, id: string, major:boolean, dead:boolean}) {
        
    }
    public on_turn(): void {
        
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
