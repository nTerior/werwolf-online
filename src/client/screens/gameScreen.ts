import { Role, RoleName, roles } from "../../role"
import { addPlayer } from "../../server/game/game"
import { Screen } from "../screen"
import { State } from "../state"

const rx = 200
const ry = rx
const wh = 0

var nightDiv = document.createElement("div")
var users = document.createElement("div")
var content = document.createElement("div")

export async function createGameScreen(): Promise<Screen> {
    var div = document.createElement("div")
    nightDiv.classList.add("background-darken")
    div.appendChild(nightDiv)
    
    State.ws.on("role-reveal", r => {
        var role: Role = r
        State.game.selfplayer.role = getRoleByRoleName(role.name)
        State.game.selfplayer.secrets = {}
        State.game.selfplayer.secrets["heal_potions"] = 1
        State.game.selfplayer.secrets["kill_potions"] = 1
        State.game.selfplayer.secrets["love"] = 2
        create()
    })

    State.ws.on("day", () => {
        nightDiv.style.display = "none";
        document.title = "Werwölfe | Tag"
    })
    State.ws.on("night", () => {
        nightDiv.style.display = "unset";
        document.title = "Werwölfe | Nacht"
    })
    State.ws.on("turn", async () => {
        nightDiv.style.display = "none";
        document.title = "Werwölfe | Du bist dran"
        await State.game.selfplayer.role?.on_turn()
    })
    State.ws.on("unturn", () => {
        nightDiv.style.display = "unset";
        document.title = "Werwölfe | Nacht";
        (<HTMLButtonElement>document.getElementById("continue-button")).hidden = true
    })
    State.ws.on("player-update", async () => {
        await updateUserTable()
    })
    State.ws.on("you-died", () => {
        document.title = "Werwölfe | Gestorben"
        var text = document.createElement("div")
        text.classList.add("game-end", "game-lost")
        var t_text = document.createElement("div")
        t_text.textContent = "Du bist gestorben"
        text.appendChild(t_text)
        div.append(text)
    })
    State.ws.on("game-lost", async () => {
        document.title = "Werwölfe | Verloren"
        var text = document.createElement("div")
        text.classList.add("game-end", "game-lost")
        var t_text = document.createElement("div")
        t_text.textContent = "Du hast verloren"
        text.appendChild(t_text)
        div.append(text)
    })
    State.ws.on("game-won", async () => {
        document.title = "Werwölfe | Gewonnen"
        var text = document.createElement("div")
        text.classList.add("game-end", "game-won")
        var t_text = document.createElement("div")
        t_text.textContent = "Du hast gewonnen 🏆"
        text.appendChild(t_text)
        div.append(text)
    })

    div.appendChild(content)

    return {
        element: div,
        title: "Werwölfe"
    }
}

async function create() {
    content.innerHTML = ""

    users.classList.add("users")
    var ss = document.styleSheets;
    ss[0].insertRule('.users { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: ' + String((rx * 2) + wh) + 'px; height: ' + String((ry * 2) + wh) + 'px; }', 1);
    ss[0].insertRule('.user-field { position: absolute; text-align: center; }', 1);
    content.appendChild(users)
    
    var role = document.createElement("div")
    role.classList.add("role")
    var role_header = document.createElement("h2")
    role_header.textContent = "Du bist ein(e) " + State.game.selfplayer.role?.name!
    role.appendChild(role_header)
    var role_description = document.createElement("div")
    role_description.textContent = State.role_description[State.game.selfplayer.role?.name!.toLowerCase()!]
    role_description.classList.add("role-description")
    role.appendChild(role_description)
    content.appendChild(role)

    await updateUserTable()


    var continue_btn = document.createElement("button")
    continue_btn.id = "continue-button"
    continue_btn.textContent = "Weiter / Zug beenden"
    continue_btn.onclick = () => { 
        State.ws.nextMove()
        continue_btn.hidden = true
    }
    continue_btn.hidden = true
    content.appendChild(continue_btn)
    State.ws.emit("night")
}

async function updateUserTable() {
    await State.game.updatePlayers()
    users.innerHTML = ""
    var n = State.game.players.length
    
    for (var i = 0; i < n; i++) {
      
      var c = await createUser(i)

      c.style.top = String(ry + -ry * Math.cos((360 / n / 180) * i * Math.PI)) + 'px';
      c.style.left = String(rx + rx * Math.sin((360 / n / 180) * i * Math.PI)) + 'px';
      users.appendChild(c);
    }
}

async function createUser(i:number) {
    var c = document.createElement('div');
    c.classList.add("user-field")
    if(await State.ws.canInteract(State.game.players[i].id) && !State.game.players[i].dead) {
        c.classList.add("clickable")
        c.onclick = () => {
            if(document.title == "Werwölfe | Du bist dran") userInteraction(State.game.players[i])
            else return // Todo day interaction
        }
    }

    var img = document.createElement("img")
    if(State.game.players[i].dead) img.src = "/static/assets/user_dead.png"
    else img.src = "/static/assets/user.png"
    img.style.width = "4em"
    c.appendChild(img)

    var name = document.createElement("div")
    name.id = "player-name-" + State.game.players[i].id
    name.textContent = State.game.players[i].name
    if(State.game.players[i].major) name.textContent += " (Bürgermeister)"
    if(State.game.selfplayer.secrets) {
        if(State.game.selfplayer.secrets["seer-" + State.game.players[i].id]) name.textContent += " » " + State.game.selfplayer.secrets["seer-" + State.game.players[i].id]
    }
    c.appendChild(name)

    return c
}

function userInteraction(player: {name: string, id: string, major:boolean, dead:boolean}) {
    State.game.selfplayer.role?.on_interact(player)
}

function getRoleByRoleName(name: string): Role {
    return roles[roles.findIndex(e => e.name == name)].role
}
