import { BackendComm } from "./comm.ts";
import { GatherResult } from "./widgets/upload.ts";
import { FileInputWidget, StringInputWidget } from "./inputWidgets.ts";
import { removeButton } from "./widgets/button.ts";
import { createInputWithLabel } from "./forms.ts";

export class AttachmentsWidget {
    readonly element: HTMLDivElement;
    private readonly comm: BackendComm;
    private nAttachmentsTabElement: HTMLSpanElement;
    private readonly attachmentsGrid: HTMLElement;
    private readonly attachmentWidgets: SingleAttachmentWidget[] = [];

    constructor(comm: BackendComm, nAttachmentsTabElement: HTMLSpanElement) {
        this.comm = comm;
        this.nAttachmentsTabElement = nAttachmentsTabElement;

        const [newPathLabel, newPathWidget] = createInputWithLabel(
            crypto.randomUUID(),
            FileInputWidget,
            [comm],
            "New attachment",
        ) as [HTMLLabelElement, FileInputWidget];
        newPathWidget.container.addEventListener("input-updated", () => {
            if (newPathWidget.size && newPathWidget.value) {
                this.addAttachmentWidget(newPathWidget.value);
                newPathWidget.value = null;
                // TODO remove file stats
                // TODO apply file stats to att widget
            }
        });
        const newPanel = document.createElement("section");
        newPanel.classList.add("cean-input-panel");
        newPanel.append(newPathLabel, newPathWidget.container);

        this.attachmentsGrid = document.createElement("section");
        this.attachmentsGrid.classList.add("cean-attachments-grid", "cean-input-panel");

        this.element = document.createElement("div");
        this.element.classList.add("cean-attachments-widget");
        this.element.append(newPanel, this.attachmentsGrid);
    }

    gatherData(): GatherResult {
        const data = this.attachmentWidgets
            .map((widget) => ({
                caption: widget.caption,
                path: widget.path,
            }))
            .filter((a) => a.path !== null);
        // TODO validation
        return { validationErrors: false, data };
    }

    private addAttachmentWidget(path: string) {
        const widget = new SingleAttachmentWidget(this.comm, path, () =>
            this.removeAttachmentWidget(widget),
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
    }
}

class SingleAttachmentWidget {
    readonly key: string = crypto.randomUUID();
    readonly element: HTMLDivElement;
    private readonly captionInput: StringInputWidget;
    private readonly fileInput: FileInputWidget;
    private readonly imageContainer: HTMLDivElement;
    private readonly removeButton: HTMLButtonElement;

    constructor(comm: BackendComm, path: string, onRemove: () => void) {
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add("cean-single-attachment-widget");

        this.removeButton = removeButton(() => {
            onRemove();
        });
        this.element.appendChild(this.removeButton);

        const [captionLabel, captionInput] = createInputWithLabel(
            `${this.key}_caption`,
            StringInputWidget,
            [{ required: true }],
            "Caption",
        );
        this.captionInput = captionInput as StringInputWidget;
        this.element.append(captionLabel, this.captionInput.container);

        const [fileLabel, fileInput] = createInputWithLabel(
            `${this.key}_file`,
            FileInputWidget,
            [comm],
            "File",
        );
        this.fileInput = fileInput as FileInputWidget;
        this.fileInput.value = path;
        this.element.append(fileLabel, this.fileInput.container);

        this.imageContainer = document.createElement("div");
        this.imageContainer.classList.add("cean-attachment-image-container");
        this.element.appendChild(this.imageContainer);

        // TODO load and display attachment
    }

    get path(): string | null {
        return this.fileInput.value;
    }

    get caption(): string | null {
        return this.captionInput.value;
    }
}
