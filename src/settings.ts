import { RoleName } from "./role"

export interface Settings {
    role_settings: {[key in RoleName]: number},
    reveal_role_death: boolean
}
