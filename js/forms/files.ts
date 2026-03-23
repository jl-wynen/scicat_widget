export class Files {
    constructor(widgets: Map<string, unknown>) {}

    get element(): HTMLElement {
        const el = document.createElement("div");
        el.textContent = "Files";
        return el;
    }
}
