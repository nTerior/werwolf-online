import { Packet } from "../../../../packet";
import { getNewRoleByRoleName, Role, RoleName, Werewolf } from "../../../../role";
import { getEnumKeyByEnumValue } from "../../../../utils";
import { Player } from "../../../game/player";
import { State } from "../../../state";
import { Action, ActionMenu } from "../../actionmenu";
import { createChat } from "../../chat";
import { displayString } from "../../display";
import { setGlobalBackground } from "../../framework";
import { Message } from "../../message";
import { createDivText, createHeader, createText } from "../../text";
import { Screen, setTitle } from "../screen";

var currentState: "day" | "night" | "turn" | "majorSuggestVote" | "dayVote" | "dead" = "night"
var majorVoteMenu = new ActionMenu("Bürgermeisterwahl", "Folgende Spieler stehen zur Auswahl. Klicke auf einen Knopf, um für diesen Spieler als Bürgermeister zu stimmen.", false)
majorVoteMenu.stays_on_new = true

var dayVoteMenu = new ActionMenu("Hinrichtung", "Folgende Spieler sind angeklagt. Klicke auf einen Knopf, um dafür zu stimmen, dass dieser Spieler hingerichtet wird.", false)
dayVoteMenu.stays_on_new = true

export function generateGameScreen(): Screen {
    setGlobalBackground("night")
    new Message("Das Spiel startet nun").display()
    displayString("Nacht", -1)
    setTitle("Nacht")
    var div = document.createElement("div")

    div.appendChild(createHeader("h2", "Du bist ein(e) " + State.game.getSelfPlayer().role?.name))
    div.appendChild(createText(State.role_info_text[getEnumKeyByEnumValue(RoleName, State.game.getSelfPlayer().role!.name)?.toLowerCase()!]))
    div.appendChild(createUserList())
    div.appendChild(createRoleCounts())

    if ([RoleName.WEREWOLF, RoleName.GIRL].includes(State.game.getSelfPlayer().role!.name)) {
        div.appendChild(createChat())
    }

    initGameLogicListeners()

    return {
        element: div,
        title: "Im Spiel"
    }
}

function initGameLogicListeners() {
    State.ws.setOnPacket("majorVoteSuggestion", packet => {
        majorVoteMenu.addAction({
            name: State.game.players.find(e => e.id == packet.data)!.name,
            onclick: () => {
                currentState = "day"
                State.ws.sendPacket(new Packet("majorVoted", {game_id: State.game.id, vote: packet.data}))
            }
        })
        if(!majorVoteMenu.shown) majorVoteMenu.show()
    })
    State.ws.setOnPacket("daytime", _packet => {
        setGlobalBackground("day")
        displayString("Tag")
        setTitle("Tag")
        currentState = "day"
        majorVoteMenu.actions = []
        majorVoteMenu.shown = false
        dayVoteMenu.actions = []
        dayVoteMenu.shown = false
    })
    State.ws.setOnPacket("player-died", packet => {
        State.game.players.find(e => e.id == packet.data.id)!.dead = true
        if (packet.data.role) {
            var r: Role = getNewRoleByRoleName(packet.data.role)!
            State.game.players.find(e => e.id == packet.data.id)!.role = r
            new Message(State.game.players.find(e => e.id == packet.data.id)!.name + " (ein(e) " + r.name + ") ist gestorben").display()
            //@ts-expect-error
            State.game.role_counts[packet.data.role]--
            //@ts-expect-error
            if(State.game.role_counts[packet.data.role] < 0) State.game.role_counts[packet.data.role] = 0
            //@ts-expect-error
            updateRoleCount(getEnumKeyByEnumValue(RoleName, packet.data.role))
        } else
            new Message(State.game.players.find(e => e.id == packet.data.id)!.name + " ist gestorben").display()
        updatePlayer(packet.data.id)
    })
    State.ws.setOnPacket("you-died", _packet => {
        displayString("Du bist gestorben!", -1, ["red"])
        currentState = "dead"
    })
    State.ws.setOnPacket("your-turn", _packet => {
        new Message("Du bist nun dran!").display()
        displayString("Du bist dran", 2000)
        setTitle("Dein Zug")
        State.game.getSelfPlayer().role?.on_turn()
        currentState = "turn"
    })
    State.ws.setOnPacket("turn-end", _packet => {
        new Message("Dein Zug ist zu Ende").display()
        displayString("Nacht", -1)
        setTitle("Nacht")
        currentState = "night"
    })
    State.ws.setOnPacket("recv-status-message", packet => {
        if(packet.data.dur) {
            new Message(packet.data.msg, packet.data.dur).display()
        } else {
            new Message(packet.data).display()
        }
    })
    State.ws.setOnPacket("love-reveal", packet => {
        var self = State.game.getSelfPlayer()
        var other = State.game.players.find(e => e.id == packet.data.id)!
        self.inLove = true
        self.loves_id = other.id
        other.inLove = true
        other.loves_id = self.id
        other.role = getNewRoleByRoleName(packet.data.role)
        updatePlayer(self.id)
        updatePlayer(other.id)

        new Message("Du bist nun in " + other.name + " (ein(e) " + packet.data.role + ") verliebt", -1).display()
        new Message("Euer neues Ziel ist nun, dass du und " + other.name + " die letzten Überlebenden seid", -1).display()
    })
    State.ws.setOnPacket("majorVote", _packet => {
        displayString("Bürgermeisterwahl")
        setTitle("Bürgermeisterwahl")
        currentState = "majorSuggestVote"
        new ActionMenu("Bürgermeisterwahl", "Es ist nun Bürgermeisterwahl. Klicke auf einen Spieler, um ihn zur Wahl zu stellen. Du kannst allerdings nur einen Spieler aufstellen.", false, {name: "Schließen", onclick: () => {}}).show()
    })
    State.ws.setOnPacket("majorReveal", packet => {
        var major = State.game.players.find(e => e.id == packet.data)!
        major.major = true
        new Message(major.name + " ist nun der neue Bürgermeister.", -1).display()
    })
    State.ws.setOnPacket("selfMajorReveal", _packet => {
        var major = State.game.getSelfPlayer()
        major.major = true
        new Message("Du bist nun der neue Bürgermeister!", -1).display()
    })
    State.ws.setOnPacket("activate-hunter", _packet => {
        new Message("Du bist gestorben. Als Jäger darfst du allerdings noch eine Person töten.", -1).display()
        displayString("", 1)
        var actions: Action[] = []
        State.game.players.forEach(p => {
            if (p == State.game.getSelfPlayer()) return
            actions.push({
                name: p.name,
                onclick: () => {
                    State.ws.sendPacket(new Packet("hunterPerformAction", { game_id: State.game.id, target_id: p.id }))
                    new Message("Du hast " + p.name + " mit in den Tod gerissen.").display()
                }
            })
        })
        new ActionMenu("Du bist als Jäger gestorben", "Du du gestorben bist, darfst du als Jäger noch eine Person töten. Welchen Spieler willst du töten?", false, ...actions).show()
    })
    State.ws.setOnPacket("dayVote", packet => {
        displayString("Hinrichtung")
        setTitle("Hinrichtung")
        currentState = "dayVote"
        new ActionMenu("Hinrichtung", "Es können nun Spieler angeklagt werden. Klicke auf einen Spieler, um ihn anzuklagen", false, {name: "Schließen", onclick: () => {}}).show()        
    })
    State.ws.setOnPacket("dayVoteSuggestion", packet => {
        dayVoteMenu.addAction({
            name: State.game.players.find(e => e.id == packet.data)!.name,
            onclick: () => {
                currentState = "day"
                State.ws.sendPacket(new Packet("dayVoted", {game_id: State.game.id, vote: packet.data}))
            }
        })
        if(!dayVoteMenu.shown) dayVoteMenu.show()
    })
    State.ws.setOnPacket("majorUse", packet => {
        var action: Action[] = []
        
        var targets: string[] = packet.data.targets
        targets.forEach(e => {
            action.push({
                name: State.game.players.find(f => f.id == e)!.name,
                onclick: () => {
                    State.ws.sendPacket(new Packet("majorExecution", {game_id: State.game.id, target: e}))
                }
            })
        })

        new ActionMenu("Hinrichtung", "Als Bürgermeister darfst du nun entscheiden, welcher der folgenden Spieler sterben soll.", false, ...action).show()
    })
}

function createRoleCounts(): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("ingame-settings-info", "game-info-inline")
    div.appendChild(createHeader("h3", "Rollen im Spiel", "ingame-settings-header"))

    for (var role in State.game.settings?.settings.role_settings) {
        //@ts-expect-error
        if (State.game.settings?.settings.role_settings[role] == 0) continue

        var role_info = document.createElement("div")
        role_info.classList.add("ingame-settings-info-role")

        var text
        if (!State.game.settings?.settings.reveal_role_death) {
            //@ts-expect-error
            text = createDivText(role + ": ? / " + State.game.settings?.settings.role_settings[role])
        } else {
            //@ts-expect-error
            text = createDivText(role + ": " + State.game.settings?.settings.role_settings[role] + " / " + State.game.settings?.settings.role_settings[role])
        }

        text.id = "ingame-settings-info-role-" + getEnumKeyByEnumValue(RoleName, role)
        role_info.appendChild(text)

        div.appendChild(role_info)
    }

    return div
}

function updateRoleCount(role: RoleName) {
    //@ts-expect-error
    (<HTMLParagraphElement>document.getElementById("ingame-settings-info-role-" + role)).textContent = RoleName[role] + ": " + State.game.role_counts[RoleName[role]] + " / " + State.game.settings?.settings.role_settings[RoleName[role]]
}

function createUserList(): HTMLDivElement {

    State.ws.setOnPacket("werewolf-reveal", packet => {
        packet.data.ids.forEach((id: string) => {
            if (id == State.game.getSelfPlayer().id) return
            State.game.players.find(e => e.id == id)!.role = new Werewolf()
            updatePlayer(id)
        });
    })

    var div = document.createElement("div")
    div.classList.add("game-user-list", "game-info-inline")

    var count = createHeader("h3", State.game.players.length + " Spieler")
    div.appendChild(count)

    State.ws.setOnPacket("player-left", async packet => {
        var index = State.game.players.findIndex(e => e.id == packet.data.id)

        div.removeChild(document.getElementById("game-player-" + packet.data.id)!)

        if (packet.data.role) {
            //@ts-expect-error
            State.game.role_counts[packet.data.role]--
            //@ts-expect-error
            if(State.game.role_counts[packet.data.role] < 0) State.game.role_counts[packet.data.role] = 0
            //@ts-expect-error
            updateRoleCount(getEnumKeyByEnumValue(RoleName, packet.data.role))
        }

        new Message(State.game.players[index].name + (packet.data.role ? " (ein(e) " + packet.data.role + ")" : "") + " hat das Spiel verlassen").display()

        var tmp = State.game.self_is_owner
        State.game.self_is_owner = packet.data.is_new_host
        if (State.game.self_is_owner && !tmp) new Message("Du bist nun der Host", -1).display()

        State.game.players.splice(index, 1)

        count.textContent = State.game.players.length + " Spieler"
    })

    State.game.players.forEach(p => {
        div.appendChild(createUser(p))
    })

    return div
}

function createUser(p: Player): HTMLDivElement {
    var div = document.createElement("div")
    div.classList.add("game-player", "clickable")
    div.id = "game-player-" + p.id
    div.onclick = _ev => {
        handlePlayerInteraction(p)
    }

    var img = p.getImage()
    img.classList.add("game-player-image")
    div.appendChild(img)

    var name = createDivText(p.name)
    name.classList.add("game-player-name")
    if (p.is_self) {
        name.classList.add("self-user-name")
    }
    div.appendChild(name)
    return div
}

export function updatePlayer(id: string) {
    var div = document.getElementById("game-player-" + id)!
    if (State.game.players.find(e => e.id == id)!.dead) {
        div.classList.remove("clickable");
        div.classList.add("player-dead");
        div.onclick = _ev => { }
    }
    (<HTMLImageElement>(div.getElementsByClassName("game-player-image")[0])).src = State.game.players.find(e => e.id == id)!.getImage().src
}

function handlePlayerInteraction(p: Player) {
    if(State.game.getSelfPlayer().dead) return

    if (currentState == "turn") {
        State.game.getSelfPlayer().role?.on_interact(p)
    } else if (currentState == "majorSuggestVote") {
        new ActionMenu("Bürgermeister vorschlagen", "Möchtest du " + p.name + " als Bürgermeister vorschlagen?", false,
        {
            name: "Ja",
            onclick: () => {
                currentState = "day"
                State.ws.sendPacket(new Packet("majorSuggestVote", {game_id: State.game.id, suggestion: p.id}))
            }
        },
        {
            name: "Nein",
            onclick: () => {}
        }).show()
    } else if (currentState = "dayVote") {
        new ActionMenu("Anklage", "Möchtest du " + p.name + " wirklich anklagen?", false,
        {
            name: "Ja",
            onclick: () => {
                currentState = "day"
                State.ws.sendPacket(new Packet("daySuggestVote", {game_id: State.game.id, suggestion: p.id}))
            }
        },
        {
            name: "Nein",
            onclick: () => {}
        }).show()
    }
}
