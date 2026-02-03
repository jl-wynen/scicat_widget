/**
 * Create a button with an icon.
 * @param icon Name of a Fontawesome icon.
 * @param callback Callback to be invoked when the button is clicked.
 */
export function iconButton(icon: string, callback: () => void): HTMLButtonElement {
    const iconElement = document.createElement("i");
    iconElement.className = `fa fa-${icon}`;

    const button = document.createElement("button");
    button.classList.add("cean-button");
    button.appendChild(iconElement);
    button.addEventListener("click", callback);

    return button;
}

export function removeButton(callback: () => void): HTMLButtonElement {
    const button = iconButton("trash", callback);
    button.classList.add("cean-button-remove");
    button.title = "Remove item";
    button.setAttribute("tabindex", "-1");
    return button;
}
