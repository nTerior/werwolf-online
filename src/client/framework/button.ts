export function createButton(text: string, onclick: () => void, ...classes: string[]): HTMLButtonElement {
    var button = document.createElement("button")
    classes.forEach(c => button.classList.add(c))
    button.textContent = text
    button.onclick = onclick
    return button
}
