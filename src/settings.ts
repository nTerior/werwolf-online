import { RoleName } from "./role"

interface ISettings {
    role_settings: {[k in RoleName]?: number},
    reveal_role_death: boolean
}

export class Settings {
    public settings: ISettings

    constructor() {
        this.settings = {
            role_settings: {},
            reveal_role_death: false
        }
    }

    public set(key: "role_settings" | "reveal_role_death", value: number | boolean, subkey?: RoleName) {
        if(subkey) {
            this.settings.role_settings[subkey] = typeof value == "number" ? value : 0
        } else {
            this.settings.reveal_role_death = typeof value == "boolean" ? value : false
        }
    }
}
