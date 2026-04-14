import { MultiAttachmentInput } from "../components/input";
import { CountSpanElement } from "../components/tabs";

export class Attachments {
    private readonly attachments: MultiAttachmentInput;
    readonly element: HTMLDivElement;

    private updateListener?: () => void = undefined;

    constructor(inputs: Map<string, unknown>) {
        this.attachments = inputs.get("attachments") as MultiAttachmentInput;

        this.element = document.createElement("div");
        this.element.append(this.attachments.container);
    }

    setCountIn(element: CountSpanElement) {
        this.updateListener = () => {
            element.set(this.attachments.nAttachments);
        };
        this.attachments.container.addEventListener(
            "input-updated",
            this.updateListener,
        );
    }

    destroy() {
        if (this.updateListener !== undefined) {
            this.attachments.container.removeEventListener(
                "input-updated",
                this.updateListener,
            );
        }
    }
}
