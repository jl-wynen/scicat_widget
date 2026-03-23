import { InputComponent } from "../components/input";
import { fieldInfo } from "../assets";

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
 * @param title Optional title text.
 */
function createLabelFor(id: string, label: string, title?: string): HTMLLabelElement {
    const el = document.createElement("label");
    el.textContent = label;
    el.setAttribute("for", id);
    if (title) el.title = title;
    return el;
}

/**
 * Create an input component and a label for it.
 *
 * @param key Unique identifier (within the parent dataset) for the input component.
 * @param componentType Type of the input component.
 * @param args Arguments to pass to the constructor of the component.
 * @param label Optional label text. If not provided, the label will be derived from the field's metadata.
 */
export function createInputWithLabel<T, A extends unknown[]>(
    key: string,
    componentType: new (key: string, ...args: A) => InputComponent<T>,
    args?: A,
    label?: string,
): [HTMLLabelElement, InputComponent<T>] {
    const inputComponent = new componentType(key, ...(args ?? ([] as unknown as A)));

    const info = fieldInfo(key);
    const labelElement = createLabelFor(
        inputComponent.inputKey,
        label ?? (info === null ? key : info.label),
        info?.description,
    );

    return [labelElement, inputComponent];
}
