import { State } from "./state";


export function devInit() {
    if (window.location.hash != "#dev") return
    console.log("Entering dev mode!")
    State.ws.on("packet-dev", (data) => {
        if (data.data.css_reload) devReloadCss()
    })

    // Expose some functions to the window for dev
    //@ts-ignore
    window.dev = {
        State
    }
}


export function devReloadCss() {
    console.log("Reloading CSS!")
    var links = document.getElementsByTagName("link");

    for (var x in links) {
        if (!links.hasOwnProperty(x)) continue
        var link = links[x];
        link.href = link.href.split("?")[0] + "?id=" + new Date().getMilliseconds();
    }

}