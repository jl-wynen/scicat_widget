import trashCanIcon from "../assets/img/trash-can.svg";
import plusIcon from "../assets/img/plus.svg";

const icons: Record<string, string> = {
    plus: plusIcon,
    trashCan: trashCanIcon,
};

/**
 * Create a button with text.
 * @param text Button text.
 * @param callback Callback to be invoked when the button is clicked.
 * @param title Optional button title.
 */
export function textButton(
    text: string,
    callback: () => void,
    title?: string,
): HTMLButtonElement {
    const button = createEmptyButton(callback, title ?? text);
    button.textContent = text;
    return button;
}

/**
 * Create a button with an icon.
 * @param icon Name of an icon.
 * @param callback Callback to be invoked when the button is clicked.
 * @param title Optional button title.
 */
export function iconButton(
    icon: string,
    callback: () => void,
    title?: string,
): HTMLButtonElement {
    const iconElement = document.createElement("i");
    iconElement.innerHTML = icons[icon];

    const button = createEmptyButton(callback, title);
    button.classList.add("icon-button");
    button.appendChild(iconElement);

    return button;
}

/**
 * Create an icon button for removing an item.
 * @param callback Callback to be invoked when the button is clicked.
 */
export function removeButton(callback: () => void): HTMLButtonElement {
    const button = iconButton("trashCan", callback, "Remove item");
    button.classList.add("remove-button");
    button.setAttribute("tabindex", "-1");
    return button;
}

/**
 * Create a button with an icon and text.
 * @param icon Name of a Fontawesome icon.
 * @param text Button text.
 * @param callback Callback to be invoked when the button is clicked.
 * @param title Optional button title.
 */
export function iconTextButton(
    icon: string,
    text: string,
    callback: () => void,
    title?: string,
): HTMLButtonElement {
    const button = iconButton(icon, callback, title ?? text);
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    button.appendChild(textSpan);
    return button;
}

function createEmptyButton(callback: () => void, title?: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    if (title !== undefined) button.title = title;
    button.addEventListener("click", callback);
    return button;
}
