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

export function removeAllActionMenus() {
    actionmenu_stack.forEach(a => {
        removeActionMenu(a.action)
    })
}

function pushActionMenu(menu: ActionMenu) {
    var tmp = actionmenu_stack.pop()
    if(tmp) {
        actionmenu_stack.push(tmp)
        if(!tmp.action.stays_on_new) removeActionMenu(tmp.action)
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
    public stays_on_new: boolean = false
    public shown: boolean = false

    constructor(title: string, description: string, cancellable: boolean, ...actions: Action[]) {
        this.title = title
        this.description = description
        this.actions = actions
        this.cancellable = cancellable
    }

    public addAction(action: Action) {
        this.actions.push(action)
        
        var build = actionmenu_stack.find(e => e.action == this)
        if (build == undefined) return
        var div = build.element
        if (div == undefined) return
        
        div.getElementsByClassName("actionmenu-actions")[0].appendChild(createButton(action.name, () => {
            
            action.onclick()
            removeActionMenu(this)

        }, "actionmenu-action"))
    }

    public show() {
        this.shown = true
        pushActionMenu(this)
    }
}
