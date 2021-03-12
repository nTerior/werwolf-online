import { get_root } from "./framework"

interface Display {
    text: string,
    element: HTMLElement
}

var display_stack: Display[] = []

export function displayString(content: string, time: number=1000, text_classes: string[] = []) {

    var last = display_stack.pop()

    if(last) {
        last.element.classList.add("display-inactive")
        try {
            setTimeout(() => get_root().removeChild(last!.element), 1000)
        } catch (DOMException) { }
    }

    var div = document.createElement("div")
    div.classList.add("display")
    div.classList.add("display-active")

    var text = document.createElement("div")
    text.textContent = content
    text.classList.add("display-text")
    text_classes.forEach(cl => text.classList.add(cl))

    div.appendChild(text)
    get_root().appendChild(div)

    if(time > 0) {
        setTimeout(() => {
            div.classList.remove("display-active")
            div.classList.add("display-inactive")
            try {
                setTimeout(() => get_root().removeChild(div), 1000)
            } catch (DOMException) {}
        }, time)
    }

    display_stack.push({text: content, element: div})

}