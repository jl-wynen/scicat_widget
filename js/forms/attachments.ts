import { MultiAttachmentInput } from "../components/input";

export class Attachments {
    readonly element: HTMLDivElement;

    constructor(widgets: Map<string, unknown>) {
        const attachments = widgets.get("attachments") as MultiAttachmentInput;

        this.element = document.createElement("div");
        this.element.append(attachments.container);
    }
}
