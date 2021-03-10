import { createButton } from "./button"
import { get_root } from "./framework"
import { createHeader, createText } from "./text"

export interface Action {
    name: string,
    onclick: () => void
}

interface ActionMenuBuild {
    action: ActionMenu,
    element: HTMLElement
}

const actionmenu_stack: ActionMenuBuild[] = []

function pushActionMenu(menu: ActionMenu) {
    var tmp = actionmenu_stack.pop()
    if(tmp) {
        actionmenu_stack.push(tmp)
        removeActionMenu(tmp.action)
    }
    var build = buildActionMenu(menu)
    actionmenu_stack.push(build)
    get_root().appendChild(build.element)
}

function removeActionMenu(menu: ActionMenu) {
    var action = actionmenu_stack.splice(actionmenu_stack.findIndex(e => e.action == menu), 1)[0]
    action.element.classList.remove("actionmenu-active")
    action.element.classList.add("actionmenu-inactive")
    setTimeout(() => get_root().removeChild(action.element), 1000)
}

function buildActionMenu(menu: ActionMenu): ActionMenuBuild {
    var div = document.createElement("div")
    div.classList.add("actionmenu", "actionmenu-active")

    div.appendChild(createHeader("h3", menu.title, "actionmenu-title"))
    div.appendChild(createText(menu.description, "actionmenu-description"))

    var actions = document.createElement("div")
    actions.classList.add("actionmenu-actions")
    menu.actions.forEach(action => {
        actions.appendChild(createButton(action.name, () => {
            
            action.onclick()
            removeActionMenu(menu)

        }, "actionmenu-action"))
    })
    div.appendChild(actions)

    if(menu.cancellable) div.appendChild(createButton("Abbrechen", () => removeActionMenu(menu), "actionmenu-cancel"))

    return {
        action: menu,
        element: div
    }
}

export class ActionMenu {
    public title: string
    public description: string
    public actions: Action[]
    public cancellable: boolean

    constructor(title: string, description: string, cancellable: boolean, ...actions: Action[]) {
        this.title = title
        this.description = description
        this.actions = actions
        this.cancellable = cancellable
    }

    public show() {
        pushActionMenu(this)
    }
}
