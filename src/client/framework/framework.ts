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

export function setGlobalBackground(img: string) {
    document.body.style.background = "url(\"/static/assets/" + img + "\") no-repeat center center fixed"
    document.body.style.backgroundSize = "cover"
}
