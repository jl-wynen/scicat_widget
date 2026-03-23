export class MetadataOverview {
    get element(): HTMLElement {
        const el = document.createElement("div");
        el.textContent = "Metadata overview";
        return el;
    }
}
