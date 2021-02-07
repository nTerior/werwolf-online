export interface Screen {
    element: HTMLElement,
    title?: string,
    on_push?: () => any,
    on_pop?: () => any
}

export interface ScreenBuild {
    screen: Screen,
    element: HTMLElement
}

var screen_stack: ScreenBuild[] = []

export const get_root = () => document.getElementById("webapp-root")

export function setScreen(screen: Screen) {
    popScreen()
    pushScreen(screen)
}

export function pushScreen(screen: Screen) {
    var build = buildScreen(screen)
    if(screen.on_push) screen.on_push()
    if(screen.title) document.title = screen.title
    screen_stack.push(build)
    get_root()?.appendChild(build.element)
}

export function popScreen() {
    var s = screen_stack.pop()

    if(s) {
        if(s.screen.on_pop) s.screen.on_pop()
        s.element.classList.remove("screen-active")
        s.element.classList.add("screen-inactive")
        get_root()?.removeChild(s.element)

        var next = screen_stack.pop()
        if(next) {
            screen_stack.push(next)
            if(next.screen.title) document.title = next.screen.title
        } else {
            document.title = "Werwölfe"
        }

    }
}

export function buildScreen(screen: Screen): ScreenBuild {
    var div = document.createElement("div")
    div.classList.add("screen")
    div.classList.add("screen-active")
    screen.element.classList.add("screen-content")
    div.appendChild(screen.element)
    return {
        screen: screen,
        element: div
    }
}
