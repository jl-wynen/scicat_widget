/**
 * Create a button with an icon.
 * @param icon Name of a Fontawesome icon.
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
