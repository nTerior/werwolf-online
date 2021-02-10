import { Game } from "./game/game";
import { WS } from "./websocket";

export class State {
    public static ws: WS;
    public static game: Game;
    public static role_description: any;
}

export async function loadRoleDescriptions() {
    var result = await (await fetch("/static/assets/role.json")).text()
    State.role_description = JSON.parse(result)
}
