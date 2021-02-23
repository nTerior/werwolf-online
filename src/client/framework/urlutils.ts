export function get_game_id(): string | undefined {
    var path = window.location.pathname.split("/")
    return path[path.length - 1]
}