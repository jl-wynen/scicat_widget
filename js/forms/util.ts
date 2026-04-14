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

/**
 * Create an output element that overflows on the left side.
 *
 * This requires the parent to restrict its size, e.g., with `min-width: 0`
 * to trigger the overflow.
 *
 * @param textContent Text to display.
 */
export function outputLeftOverflow(textContent: string): HTMLOutputElement {
    // The overflow happens via the <output> element and its class.
    // So <output> uses a right-to-left direction. But that breaks punctuation.
    // To fix this, the text content is in a nested <bdo> with left-to-right direction.

    const bdo = document.createElement("bdo");
    bdo.dir = "ltr";
    bdo.textContent = textContent;
    bdo.title = textContent;

    const el = document.createElement("output");
    el.classList = "cean-left-overflow";
    el.dir = "rtl";
    el.append(bdo);
    return el;
}
