import { BackendComm, ResLoadImage } from "./comm.ts";
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
                newPathWidget.clear();
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
        widget.remove();
    }
}

class SingleAttachmentWidget {
    readonly key: string = crypto.randomUUID();
    readonly comm: BackendComm;
    readonly element: HTMLDivElement;
    private readonly captionInput: StringInputWidget;
    private readonly fileInput: FileInputWidget;
    private readonly imageContainer: HTMLDivElement;
    private readonly removeButton: HTMLButtonElement;

    constructor(comm: BackendComm, path: string, onRemove: () => void) {
        this.comm = comm;
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
            [comm, path],
            "File",
        );
        this.fileInput = fileInput as FileInputWidget;
        fileInput.container.addEventListener("input-updated", () => {
            this.updateImage();
        });
        this.element.append(fileLabel, this.fileInput.container);

        this.imageContainer = document.createElement("div");
        this.imageContainer.classList.add("cean-attachment-image-container");
        this.element.appendChild(this.imageContainer);

        this.comm.onResLoadImage(this.key, (response) => {
            this.handleLoadImage(response);
        });
    }

    remove() {
        this.element.remove();
        this.fileInput.destroy();
        this.comm.offResLoadImage(this.key);
    }

    get path(): string | null {
        return this.fileInput.value;
    }

    get caption(): string | null {
        return this.captionInput.value;
    }

    private updateImage() {
        const path = this.fileInput.value;
        if (!path) {
            this.clearImage();
            return;
        }
        this.loadImage(path);
    }

    private loadImage(path: string) {
        this.comm.sendReqLoadImage(this.key, { path });
    }

    private handleLoadImage(response: ResLoadImage) {
        if (response.error) {
            this.imageContainer.textContent = response.error;
            this.imageContainer.classList.add("cean-error");
        } else if (!response.image) {
            this.imageContainer.textContent = "Error: No image";
            this.imageContainer.classList.add("cean-error");
        } else if (!response.image.startsWith("data:image/")) {
            this.imageContainer.textContent = "Error: Invalid image";
            this.imageContainer.classList.add("cean-error");
        } else {
            const img = document.createElement("img");
            img.src = response.image;
            img.alt = "Image";
            this.imageContainer.replaceChildren(img);
            this.imageContainer.classList.remove("cean-error");
            this.captionInput.value = response.caption ?? "";
        }
    }

    private clearImage() {
        this.imageContainer.innerHTML = "";
    }
}
