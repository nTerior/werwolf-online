export function get_game_id() {
    var url = new URLSearchParams(window.location.search)
    if(url.has("game")) return url.get("game")
    return undefined
}