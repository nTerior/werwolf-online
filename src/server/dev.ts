import { EventEmitter } from "events";
import { watch } from "fs";
import { join } from "path";

export var dev_events = new EventEmitter()

function createWatch(subpath="") {
    subpath = subpath == "" ? "" : "/" + subpath
    watch(join(__dirname,"../../public/css" + subpath), (event,filename) => {
        console.log(`Reloading css because of '${event} on ${filename}'`);
        dev_events.emit("packet", {
            css_reload: true
        })  
    })
}

export function devModeInit() {
    createWatch("")
    createWatch("framework")
    createWatch("screens")
}