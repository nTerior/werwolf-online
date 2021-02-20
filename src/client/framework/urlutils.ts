export function get_game_id(): string | undefined {
    var i = window.location.href.substring(window.location.href.lastIndexOf('/') + 1)
    return i != "" && i != "werwolf" ? i : undefined
}