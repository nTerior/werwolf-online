export function createImage(src: string, ...classes: string[]): HTMLImageElement {
    var img = document.createElement("img")
    classes.forEach(c => img.classList.add(c))
    img.src = src
    return img
}