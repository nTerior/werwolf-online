export const get_root = () => document.getElementById("webapp-root")!

export function append(element: HTMLElement) {
    get_root().appendChild(element)
}

export function remove(element: HTMLElement) {
    get_root().removeChild(element)
}

export function addBreak(div: HTMLElement) {
    div.appendChild(document.createElement("br"))
}

export function setGlobalBackground(img: "day" | "night") {
    document.body.style.background = "url(\"/static/assets/background_" + img + ".png\") no-repeat center center fixed"
    document.body.style.backgroundSize = "cover"

    if(img == "day") {
        document.body.classList.remove("night")
        document.body.classList.add("day")
    } else {
        document.body.classList.remove("day")
        document.body.classList.add("night")
    }

}

export function disableContextMenu() {
    document.addEventListener("contextmenu", e => {
        e.preventDefault()
    })
}
