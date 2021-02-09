
import { EventEmitter } from "events";
import { watch } from "fs";
import { join } from "path";

export var dev_events = new EventEmitter()

export function devModeInit() {
    watch(join(__dirname,"../../public/css"), (event,filename) => {
        console.log(`Reloading css because of '${event} on ${filename}'`);
        dev_events.emit("packet",{
            css_reload: true
        })
        
    })
    watch(join(__dirname,"../../public/css/screens"), (event,filename) => {
        console.log(`Reloading css because of '${event} on ${filename}'`);
        dev_events.emit("packet",{
            css_reload: true
        })
        
    })
}