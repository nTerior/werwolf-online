import { Logger } from "./logger"
import { State } from "./state"

export function devInit() {
    if (window.location.hash != "#dev") return
    Logger.log(["dev"], "Entering dev mode ...")
    State.ws.setOnPacket("dev-packet", (packet) => {
        if (packet.data.css_reload) devReloadCss()
    })
    //@ts-expect-error
    window.dev = {
        State
    }
}


export function devReloadCss() {
    Logger.log(["dev"], "Reloading CSS")
    var links = document.getElementsByTagName("link");

    for (var x in links) {
        if (!links.hasOwnProperty(x)) continue
        var link = links[x];
        link.href = link.href.split("?")[0] + "?id=" + new Date().getMilliseconds();
    }

}