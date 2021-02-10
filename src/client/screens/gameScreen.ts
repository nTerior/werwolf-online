import { Role, RoleName, roles } from "../../role"
import { Screen } from "../screen"
import { State } from "../state"

const rx = 200
const ry = rx
const wh = 0

var nightDiv = document.createElement("div")
var users = document.createElement("div")

export async function createGameScreen(): Promise<Screen> {
    nightDiv.classList.add("background-darken")

    var div = document.createElement("div")
    State.ws.on("role-reveal", async r => {
        var role: Role = r
        State.game.selfplayer.role = getRoleByRoleName(role.name)
    })

    State.ws.on("day",() => {
        nightDiv.style.display = "none";
    })
    State.ws.on("night",() => {
        nightDiv.style.display = "unset";
    })

    await State.game.updatePlayers()
    users.classList.add("users")
    var ss = document.styleSheets;
    ss[0].insertRule('.users { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: ' + String((rx * 2) + wh) + 'px; height: ' + String((ry * 2) + wh) + 'px; }', 1);
    ss[0].insertRule('.user-field { position: absolute; text-align: center; }', 1);
    div.appendChild(users)
    
    var role = document.createElement("div")
    role.classList.add("role")
    var role_header = document.createElement("h2")
    role_header.textContent = "Du bist ein(e) " + State.game.selfplayer.role?.name!
    role.appendChild(role_header)
    var role_description = document.createElement("div")
    role_description.textContent = State.role_description[State.game.selfplayer.role?.name!.toLowerCase()!]
    role_description.classList.add("role-description")
    role.appendChild(role_description)
    div.appendChild(role)

    State.ws.emit("day")
    await updateUserTable()
    div.appendChild(nightDiv)
    return {
        element: div,
        title: "Werwölfe"
    }
}

async function updateUserTable() {
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
    if(await State.ws.canInteract(State.game.players[i].id)) {
        c.classList.add("clickable")
        c.onclick = () => userInteraction(State.game.players[i])
    }

    var img = document.createElement("img")
    if(State.game.players[i].dead) img.src = "/static/assets/user_dead.png"
    else img.src = "/static/assets/user.png"
    img.style.width = "4em"
    c.appendChild(img)

    var name = document.createElement("div")
    name.textContent = State.game.players[i].name
    if(State.game.players[i].major) name.textContent += " (Bürgermeister)"
    c.appendChild(name)

    return c
}

function userInteraction(player: {name: string, id: string, major:boolean, dead:boolean}) {
    State.game.selfplayer.role?.on_turn(player)
}

function getRoleByRoleName(name: string): Role {
    return roles[roles.findIndex(e => e.name == name)].role
}
