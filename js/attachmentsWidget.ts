import { BackendComm } from "./comm.ts";
import { GatherResult } from "./widgets/upload.ts";

export class AttachmentsWidget {
    readonly element: HTMLDivElement;
    private readonly comm: BackendComm;
    private nAttachmentsTabElement: HTMLSpanElement;
    private readonly attachmentsGrid: HTMLElement;
    private readonly attachmentWidgets: SingleAttachmentWidget[] = [];

    constructor(comm: BackendComm, nAttachmentsTabElement: HTMLSpanElement) {
        this.comm = comm;
        this.nAttachmentsTabElement = nAttachmentsTabElement;

        const addButton = document.createElement("button");
        addButton.onclick = () => this.addAttachmentWidget();

        this.attachmentsGrid = document.createElement("section");
        this.attachmentsGrid.classList.add("cean-attachments-grid");

        this.element = document.createElement("div");
        this.element.classList.add("cean-attachments-widget");
        this.element.append(addButton, this.attachmentsGrid);

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
        this.attachmentsGrid.appendChild(widget.element);
        this.attachmentWidgets.push(widget);
        this.nAttachmentsTabElement.textContent = `(${this.attachmentWidgets.length})`;
    }

    private removeAttachmentWidget(widget: SingleAttachmentWidget) {
        const index = this.attachmentWidgets.indexOf(widget);
        if (index !== -1) {
            this.attachmentWidgets.splice(index, 1);
        }
        widget.element.remove();

        if (this.attachmentWidgets.length === 0) {
            this.addAttachmentWidget();
        }
    }
}

class SingleAttachmentWidget {
    readonly key: string = crypto.randomUUID();
    readonly element: HTMLDivElement;

    constructor(comm: BackendComm, onChange: () => void, onRemove: () => void) {
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add("cean-single-attachment-widget");
    }
}
