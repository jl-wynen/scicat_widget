export class Attachments {
    constructor(widgets: Map<string, unknown>) {}

    get element(): HTMLElement {
        const el = document.createElement("div");
        el.textContent = "Attachments";
        return el;
    }
}
