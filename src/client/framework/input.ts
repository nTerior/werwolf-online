export function createInputField(placeholder: string, default_text: string, on_key_enter: () => void, id: string, forbidden_keys: string[], ...classes: string[]): HTMLInputElement {
    var input = document.createElement("input")
    classes.forEach(c => input.classList.add(c))
    input.value = default_text
    input.placeholder = placeholder
    if(id != "") input.id = id
    input.onkeydown = (ev) => {
        if(ev.key == "Enter") {
            on_key_enter()
        }
        if(forbidden_keys.includes(ev.key) || forbidden_keys.includes("*")) return false
    }
    return input
}

export function createCheckbox(text: string, checked: boolean, onchange: () => void, id: string, enabled: boolean, ...classes: string[]): HTMLDivElement {
    var div = document.createElement("div")
    
    var label = document.createElement("label")
    label.setAttribute("for", id)
    label.textContent = text
    div.appendChild(label)

    var checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = checked
    checkbox.id = id
    checkbox.name = id
    checkbox.disabled = !enabled
    classes.forEach(c => checkbox.classList.add(c))
    div.appendChild(checkbox)
    
    return div
}
