import { Game } from "./game/game";
import { WebsocketClient } from "./websocket";

export class State {
    public static ws: WebsocketClient
    public static game: Game
    public static role_popup_text: any;
}

export async function loadRolePopupTexts() {
    var result = await (await fetch("/static/assets/role-popup.json")).text()
    State.role_popup_text = JSON.parse(result)
}
