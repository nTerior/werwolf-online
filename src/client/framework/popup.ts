import { RoleName } from "../../role";
import { createButton } from "./button";
import { get_root } from "./framework";
import { createImage } from "./image";
import { createHeader, createText } from "./text";

export function displayRolePopup(name: RoleName) {
    console.log(name)

    var bck = document.createElement("div")
    bck.classList.add("role-popup-background")
    var div = document.createElement("div")
    div.classList.add("role-popup")

    var title = document.createElement("h1")
    //@ts-expect-error
    title.textContent = RoleName[name]
    div.appendChild(title)

    var description = document.createElement("div")
    description.classList.add("role-popup-description")
    description.textContent = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
    div.appendChild(description)

    div.appendChild(createHeader("h3", "Folgende Bilder werden verwendet:"))

    var images = document.createElement("div")
    var img_normal = document.createElement("div")
    img_normal.classList.add("role-display")
    img_normal.classList.add("pop")
    img_normal.appendChild(createImage("/static/assets/characters/" + name.toLowerCase() + ".png", "role-display-img"))
    img_normal.appendChild(createText("Normal", "role-display-name"))
    images.appendChild(img_normal)
    
    var img_dead = document.createElement("div")
    img_dead.classList.add("role-display")
    img_dead.appendChild(createImage("/static/assets/characters/" + name.toLowerCase() + "_dead.png", "role-display-img"))
    img_dead.appendChild(createText("Tot", "role-display-name"))
    images.appendChild(img_dead)

    var img_love = document.createElement("div")
    img_love.classList.add("role-display")
    img_love.appendChild(createImage("/static/assets/characters/" + name.toLowerCase() + "_love.png", "role-display-img"))
    img_love.appendChild(createText("Verliebt", "role-display-name"))
    images.appendChild(img_love)

    var img_love_dead = document.createElement("div")
    img_love_dead.classList.add("role-display")
    img_love_dead.appendChild(createImage("/static/assets/characters/" + name.toLowerCase() + "_love_dead.png", "role-display-img"))
    img_love_dead.appendChild(createText("Verliebt und tot", "role-display-name"))
    images.appendChild(img_love_dead)
    div.appendChild(images)

    div.appendChild(createButton("OK", () => get_root().removeChild(bck), "popup-ok-btn"))

    bck.appendChild(div)
    get_root().appendChild(bck)
}