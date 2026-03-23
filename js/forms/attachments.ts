export class Attachments {
    get element(): HTMLElement {
        const el = document.createElement("div");
        el.textContent = "Attachments";
        return el;
    }
}
