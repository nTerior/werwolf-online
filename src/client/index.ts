const get_root = () => document.getElementById("webapp-root")

export function append_element(el:HTMLElement) {
    get_root()?.appendChild(el)
}

async function init() {
    // Add your starting point here
}

window.onload = init
