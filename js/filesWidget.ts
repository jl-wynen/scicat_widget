import type { AnyModel } from "@anywidget/types";
import {
    DropdownInputWidget,
    FileInputWidget,
    StringInputWidget,
} from "./inputWidgets.ts";
import { iconButton } from "./widgets/iconButton.ts";
import { createInputWithLabel } from "./forms.ts";

export class FilesWidget {
    element: HTMLDivElement;
    private readonly model: AnyModel<object>;
    private readonly fileWidgets: SingleFileWidget[] = [];
    private nFilesTabElement: HTMLSpanElement;
    private nFilesElement: HTMLSpanElement;
    private totalSizeElement: HTMLSpanElement;

    constructor(model: AnyModel<object>, nFilesTabElement: HTMLSpanElement) {
        this.model = model;
        this.nFilesTabElement = nFilesTabElement;

        const element = document.createElement("div");
        element.classList.add("cean-files-widget");

        element.appendChild(this.createSummary());
        element.appendChild(createGeneralInputs());
        element.appendChild(this.createFileWidgets());

        this.element = element;
    }

    private updateSummary() {
        const nFiles = this.fileWidgets
            .filter((w) => w.size !== null)
            .length.toString();
        this.nFilesElement.textContent = nFiles;
        this.nFilesTabElement.textContent = `(${nFiles})`;

        let size = 0;
        for (const widget of this.fileWidgets) {
            size += widget.size ?? 0;
        }
        this.totalSizeElement.textContent = humanSize(size);
    }

    private createSummary() {
        const container = document.createElement("div");

        this.nFilesElement = document.createElement("span");
        this.nFilesElement.textContent = "0";
        container.appendChild(this.nFilesElement);
        const nFilesLabel = document.createElement("span");
        nFilesLabel.textContent = "Files";
        container.appendChild(nFilesLabel);

        const sizeLabel = document.createElement("span");
        sizeLabel.textContent = "Total Size:";
        container.appendChild(sizeLabel);
        this.totalSizeElement = document.createElement("span");
        this.totalSizeElement.textContent = humanSize(0);
        container.appendChild(this.totalSizeElement);

        return container;
    }

    private createFileWidgets() {
        const container = document.createElement("div");

        const label = document.createElement("div");
        label.textContent = "Files:";
        container.appendChild(label);

        const widget = new SingleFileWidget(this.model, () => this.updateSummary());
        container.appendChild(widget.element);
        this.fileWidgets.push(widget);
        const widget2 = new SingleFileWidget(this.model, () => this.updateSummary());
        container.appendChild(widget2.element);
        this.fileWidgets.push(widget2);

        return container;
    }
}

class SingleFileWidget {
    readonly key: string;
    readonly element: HTMLDivElement;
    private readonly responseHandler: (response: any) => void;
    private size_: number | null = null;
    private creationTime_: Date | null = null;

    constructor(model: AnyModel<object>, onChange: () => void) {
        this.key = crypto.randomUUID();
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add("cean-single-file-widget");
        this.element.classList.add("cean-input-grid");

        const input = new FileInputWidget();
        input.setKey(this.key);
        input.element.classList.add("cean-file-input");
        this.element.appendChild(input.element);

        const removeButton = iconButton("trash", () => this.remove(model));
        removeButton.setAttribute("disabled", "true");
        removeButton.classList.add("cean-remove-item");
        this.element.appendChild(removeButton);

        const stats = document.createElement("div");
        stats.classList.add("cean-file-stats");
        this.element.appendChild(stats);

        this.responseHandler = (message: any) => {
            if (message.type !== "rsp:inspect-file") return;
            const payload = message.payload;
            if (payload.key !== this.key) return;

            this.renderFileStats(payload, input, stats);
            onChange();
        };
        model.on("msg:custom", this.responseHandler);

        input.element.addEventListener("input-updated", () => {
            if (input.value === null) {
                stats.replaceChildren();
                this.size_ = null;
                this.creationTime_ = null;
                onChange();
                return;
            }
            model.send({
                type: "req:inspect-file",
                payload: {
                    filename: input.value,
                    key: this.key, // To identify responses for this input element.
                },
            });
        });
    }

    get size(): number | null {
        return this.size_;
    }

    get creationTime(): Date | null {
        return this.creationTime_;
    }

    private remove(model: AnyModel<object>) {
        this.element.remove();
        model.off("msg:custom", this.responseHandler);
    }

    private renderFileStats(
        payload: any,
        input: FileInputWidget,
        stats: HTMLDivElement,
    ) {
        if (payload.success) {
            this.size_ = payload.size;
            this.creationTime_ = new Date(payload.creationTime);

            delete input.element.dataset.error;

            const sizeLabel = document.createElement("span");
            sizeLabel.textContent = "Size:";
            const size = document.createElement("span");
            size.textContent = humanSize(payload.size);

            const createdLabel = document.createElement("span");
            createdLabel.textContent = "Created:";
            const created = document.createElement("span");
            created.textContent = this.creationTime_.toLocaleString();

            stats.replaceChildren(sizeLabel, size, createdLabel, created);
        } else {
            this.size_ = null;
            this.creationTime_ = null;

            input.element.dataset["error"] = "true";

            const span = document.createElement("span");
            span.textContent = payload.error;
            stats.replaceChildren(span);
        }
    }
}

function createGeneralInputs(): HTMLElement {
    const container = document.createElement("div");
    container.style.gridTemplateColumns = "max-content 1fr";
    container.classList.add("cean-input-grid");

    const [sourceFolderLabel, sourceFolderInput] = createInputWithLabel(
        "Source folder",
        StringInputWidget,
    );
    container.appendChild(sourceFolderLabel);
    container.appendChild(sourceFolderInput.element);

    const [algLabel, algInput] = createInputWithLabel(
        "Checksum algorithm",
        DropdownInputWidget,
        CHECKSUM_ALGORITHMS,
    );
    algInput.element.classList.add("cean-chk-alg");
    container.appendChild(algLabel);
    container.appendChild(algInput.element);

    return container;
}

function humanSize(size: number): string {
    const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    const value = (size / Math.pow(1024, i)).toFixed(2);
    const unit = ["B", "kiB", "MiB", "GiB", "TiB"][i];
    return `${value} ${unit}`;
}

// Checksum algorithms supported by Python (Scitacean) and SciCat.
// The first one is the default.
const CHECKSUM_ALGORITHMS = ["blake2b", "sha256", "md5"];
