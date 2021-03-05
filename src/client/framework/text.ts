export function createHeader(type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6", text: string, ...classes: string[]): HTMLHeadingElement {
    var header = document.createElement(type)
    classes.forEach(c => header.classList.add(c))
    header.textContent = text
    return header
}

export function createText(text: string, ...classes: string[]): HTMLHeadingElement {
    var header = document.createElement("p")
    classes.forEach(c => header.classList.add(c))
    header.textContent = text
    return header
}

export function createDivText(text: string, ...classes: string[]): HTMLHeadingElement {
    var header = document.createElement("div")
    classes.forEach(c => header.classList.add(c))
    header.textContent = text
    return header
}
