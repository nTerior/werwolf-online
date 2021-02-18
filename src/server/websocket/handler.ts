import { PacketResult } from "./server";
import * as lws from "ws"

export const packetHandler: {[key: string]: (data: any, ws: lws, id: string) => Promise<PacketResult>} = {

}