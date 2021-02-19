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
        if(forbidden_keys.includes(ev.key)) return false
    }
    return input
}
