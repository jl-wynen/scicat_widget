import { InputWidget } from "./inputWidgets/inputWidget";

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
 * @param target The form element the label is for. Must have an `id`.
 * @param label The label text.
 */
export function createLabelFor(target: HTMLElement, label: string): HTMLLabelElement {
    const el = document.createElement("label");
    el.textContent = label;
    el.setAttribute("for", target.id);
    return el;
}

/**
 * Create an input widget and a label for it.
 *
 * @param key Unique identifier (within the parent dataset) for the input widget.
 * @param widgetType Type of the input widget.
 * @param args Arguments to pass to the constructor of the widget.
 */
export function createInputWithLabel<T, A extends unknown[]>(
    key: string,
    label: string,
    widgetType: new (key: string, ...args: A) => InputWidget<T>,
    ...args: A
): [HTMLLabelElement, InputWidget<T>] {
    const inputWidget = new widgetType(key, ...args);
    const labelElement = createLabelFor(inputWidget.element, `${label}:`);
    return [labelElement, inputWidget];
}
