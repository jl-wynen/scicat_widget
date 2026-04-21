const FA_ICONS = ["chevron-down", "folder-open", "pen", "plus", "trash"];

const CUSTOM_ICONS: Record<string, string> = {};

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
    const button = createEmptyButton(callback, title);
    button.classList.add("cean-icon-button");
    button.appendChild(createIcon(icon));
    return button;
}

/**
 * Create an icon button for removing an item.
 * @param callback Callback to be invoked when the button is clicked.
 */
export function removeButton(callback: () => void): HTMLButtonElement {
    const button = iconButton("trash", callback, "Remove item");
    button.classList.add("cean-remove-button");
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

/**
 * Create a toggle button with an icon and text.
 * @param icon Name of a Fontawesome icon.
 * @param text Button text.
 * @param callback Callback to be invoked when the button is clicked.
 * @param title Optional button title.
 */
export function toggleButton(
    icon: string,
    text: string,
    callback: (event: Event) => void,
    title?: string,
): HTMLLabelElement {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", callback);

    const span = document.createElement("span");
    span.textContent = text;

    const label = document.createElement("label");
    label.classList.add("cean-toggle-button", "cean-button");
    label.title = title ?? "";
    label.append(checkbox, createIcon(icon), span);
    return label;
}

function createEmptyButton(callback: () => void, title?: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("cean-button");
    if (title !== undefined) button.title = title;
    button.addEventListener("click", callback);
    return button;
}

function createIcon(icon: string): HTMLElement {
    const iconElement = document.createElement("i");
    if (FA_ICONS.includes(icon)) {
        iconElement.className = `fa fa-${icon}`;
    } else {
        iconElement.innerHTML = CUSTOM_ICONS[icon];
    }
    return iconElement;
}
