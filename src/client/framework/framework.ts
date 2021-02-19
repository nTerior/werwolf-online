export const get_root = () => document.getElementById("webapp-root")!

export function append(element: HTMLElement) {
    get_root().appendChild(element)
}

export function remove(element: HTMLElement) {
    get_root().removeChild(element)
}
