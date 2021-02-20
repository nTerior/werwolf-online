import { Game } from "./game/game";
import { WebsocketClient } from "./websocket";

export class State {
    public static ws: WebsocketClient
    public static game: Game
}