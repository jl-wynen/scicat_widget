import { InputComponent } from "../components/input";
import { fieldInfo } from "../assets";

/**
 * Create a label for an input component.
 *
 * @param component Input component to create a label for.
 * @param label Optional label text.
 * @param title Optional title text.
 */
export function createLabelFor<T>(
    component: InputComponent<T>,
    label?: string,
    title?: string,
): HTMLLabelElement {
    const info = fieldInfo(component.key);

    const el = document.createElement("label");
    el.setAttribute("for", component.id);
    el.textContent = label ?? info?.label ?? "Unknown field";

    const t = title ?? info?.description;
    if (t) el.title = t;

    if (component.required) {
        el.classList.add("cean-required");
    }

    return el;
}
