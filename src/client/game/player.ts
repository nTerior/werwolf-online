import { Role, RoleName } from "../../role"

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

    private getImageSource() {
        if(this.role) return "/static/assets/characters/" + getEnumKeyByEnumValue(RoleName, this.role!.name)?.toLowerCase() + (this.inLove ? "_love" : "") + (this.dead ? "_dead" : "") + ".png"
        return "/static/assets/characters/" + getEnumKeyByEnumValue(RoleName, RoleName.VILLAGER)?.toLowerCase() + (this.inLove ? "_love" : "") + (this.dead ? "_dead" : "") + ".png"
    }

    public getImage(): HTMLImageElement {
        var img = document.createElement("img")
        img.src = this.getImageSource()
        return img
    }
}

function getEnumKeyByEnumValue<T extends {[index:string]:string}>(myEnum:T, enumValue:string):keyof T|null {
    let keys = Object.keys(myEnum).filter(x => myEnum[x] == enumValue);
    return keys.length > 0 ? keys[0] : null;
}
