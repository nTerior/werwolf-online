import { append, remove } from "../framework"

const main_title = "Werwölfe"

export interface Screen {
    element: HTMLElement,
    title?: string,
    on_push?: () => void,
    on_pop?: () => void
}

export interface ScreenBuild {
    screen: Screen,
    element: HTMLElement
}

var screen_stack: ScreenBuild[] = []

export function nextScreen(screen: Screen) {
    popScreen()
    pushScreen(screen)
}

export function setTitle(title?: string) {
    if(title != undefined) document.title = main_title + " | " + title
    else document.title = main_title
}

export function pushScreen(screen: Screen) {
    var build = buildScreen(screen)
    if(screen.on_push) screen.on_push()
    if(screen.title) setTimeout(screen.title)
    else document.title = main_title
    screen_stack.push(build)
    append(build.element)
}

export function popScreen() {
    var build = screen_stack.pop()
    if(!build) return

    if(build.screen.on_pop) build.screen.on_pop()
    build.element.classList.remove("screen-active")
    build.element.classList.add("screen-inactive")

    remove(build.element)

    var next = screen_stack.pop()
    if(next) {
        screen_stack.push(next)
        if(next.screen.title) setTitle(next.screen.title)
    } else {
        setTitle()
    }
}

export function buildScreen(screen: Screen): ScreenBuild {
    var div = document.createElement("div")
    div.classList.add("screen", "screen-active")
    screen.element.classList.add("screen-content")
    div.appendChild(screen.element)
    return {
        screen: screen,
        element: div
    }
}
