import { InputWidget } from "./inputWidgets/inputWidget";
import { fieldInfo } from "./assets.ts";

/**
 * Create an element for a form.
 *
 * @param tagName HTML tag of the element.
 */
export function createFormElement(tagName: string): HTMLElement {
    const el = document.createElement(tagName);
    el.id = crypto.randomUUID();
    return el;
}

/**
 * Create a label for a form element.
 *
 * @param id The id of the element to target with this label.
 * @param label The label text.
 */
function createLabelFor(id: string, label: string): HTMLLabelElement {
    const el = document.createElement("label");
    el.textContent = label;
    el.setAttribute("for", id);
    return el;
}

/**
 * Create an input widget and a label for it.
 *
 * @param key Unique identifier (within the parent dataset) for the input widget.
 * @param widgetType Type of the input widget.
 * @param args Arguments to pass to the constructor of the widget.
 * @param label Optional label text. If not provided, the label will be derived from the field's metadata.
 */
export function createInputWithLabel<T, A extends unknown[]>(
    key: string,
    widgetType: new (key: string, ...args: A) => InputWidget<T>,
    args?: A,
    label?: string,
): [HTMLLabelElement, InputWidget<T>] {
    const inputWidget = new widgetType(key, ...(args ?? ([] as unknown as A)));

    const info = fieldInfo(key);
    const labelElement = createLabelFor(
        inputWidget.id,
        label ?? (info === null ? key : info.label),
    );
    labelElement.title = info?.description ?? "";
    if (inputWidget.required) labelElement.classList.add("cean-required");

    return [labelElement, inputWidget];
}
