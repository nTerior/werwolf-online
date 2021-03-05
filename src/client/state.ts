import { Game } from "./game/game";
import { WebsocketClient } from "./websocket";

export class State {
    public static ws: WebsocketClient
    public static game: Game
    public static role_popup_text: any;
    public static role_info_text: any;
}

export async function loadRolePopupTexts() {
    var result = await (await fetch("/static/assets/role-popup.json")).text()
    State.role_popup_text = JSON.parse(result)
}

export async function loadRoleInfoTexts() {
    var result = await (await fetch("/static/assets/role-info.json")).text()
    State.role_info_text = JSON.parse(result)
}
