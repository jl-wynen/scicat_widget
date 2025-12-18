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
