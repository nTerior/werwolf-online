import { Role } from "../../role"

export class Player {
    public name: string
    public id: string
    
    public role?: Role
    
    public dead: boolean = false
    public inLove: boolean = false
    public major: boolean = false

    public loves_id: string = ""
    public undersleeper_id: string = ""
    public sleeping_by: string = ""

    constructor(name: string, id: string) {
        this.name = name
        this.id = id
    }
}
