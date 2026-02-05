import { BackendComm } from "./comm.ts";
import { GatherResult } from "./widgets/upload.ts";

export class AttachmentsWidget {
    readonly element: HTMLDivElement;
    private readonly comm: BackendComm;
    private nAttachmentsTabElement: HTMLSpanElement;
    private readonly widgetsContainer: HTMLElement;
    private readonly attachmentWidgets: SingleAttachmentWidget[] = [];

    constructor(comm: BackendComm, nAttachmentsTabElement: HTMLSpanElement) {
        this.comm = comm;
        this.nAttachmentsTabElement = nAttachmentsTabElement;

        this.widgetsContainer = document.createElement("section");
        this.widgetsContainer.classList.add("cean-attachments-container");
        this.element = document.createElement("div");
        this.element.classList.add("cean-attachments-widget");
        this.element.appendChild(this.widgetsContainer);

        this.addAttachmentWidget();
    }

    gatherData(): GatherResult {
        // TODO validation
        return { validationErrors: false, data: {} };
    }

    private addAttachmentWidget() {
        const widget = new SingleAttachmentWidget(
            this.comm,
            () => {
                if (
                    widget ===
                        this.attachmentWidgets[this.attachmentWidgets.length - 1] &&
                    widget.path !== null
                ) {
                    this.addAttachmentWidget();
                }
            },
            () => this.removeAttachmentWidget(widget),
        );
        this.widgetsContainer.appendChild(widget.element);
        this.attachmentWidgets.push(widget);
    }
}

class SingleAttachmentWidget {
    readonly key: string = crypto.randomUUID();
    readonly element: HTMLDivElement;

    constructor(comm: BackendComm, onChange: () => void, onRemove: () => void) {
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add("cean-single-attachment-widget", "cean-input-grid");
    }
}
