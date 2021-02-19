import { Logger } from "./logger"
import { State } from "./state"

export function devInit() {
    if (window.location.hash != "#dev") return
    Logger.log(["dev"], "Entering dev mode ...")
    State.ws.setOnPacket("dev-packet", (data) => {
        if (data.css_reload) devReloadCss()
    })
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