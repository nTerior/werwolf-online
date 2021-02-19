export function get_game_id(): string | undefined {
    var i = ""
    return (i = window.location.pathname.replace("/" ,"")) != "" ? i : undefined
}