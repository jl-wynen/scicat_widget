import type { AnyModel } from "@anywidget/types";
import { FileInputWidget, StringInputWidget } from "./inputWidgets.ts";
import { iconButton } from "./widgets/iconButton.ts";

export class FilesWidget {
    element: HTMLDivElement;
    private model: AnyModel<object>;
    private fileWidgets: [SingleFileWidget];
    private nFilesElement: HTMLSpanElement;
    private totalSizeElement: HTMLSpanElement;

    constructor(model: AnyModel<object>) {
        this.model = model;

        const element = document.createElement("div");
        element.classList.add("cean-files-widget");

        element.appendChild(this.createSummary());

        const widget = new SingleFileWidget(model, () => this.updateSummary());
        element.appendChild(widget.element);
        this.fileWidgets = [widget];
        const widget2 = new SingleFileWidget(model, () => this.updateSummary());
        element.appendChild(widget2.element);
        this.fileWidgets.push(widget2);

        this.element = element;
    }

    private updateSummary() {
        this.nFilesElement.textContent = this.fileWidgets
            .filter((w) => w.size !== null)
            .length.toString();

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

        const input = new FileInputWidget();
        input.setKey(this.key);
        input.element.classList.add("cean-file-input");
        this.element.appendChild(input.element);

        const removeButton = iconButton("trash", () => this.remove(model));
        removeButton.disabled = true;
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
                clearFileStats(input, stats);
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

function clearFileStats(input: FileInputWidget, stats: HTMLDivElement) {
    stats.replaceChildren();
}

function humanSize(size: number): string {
    const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    const value = (size / Math.pow(1024, i)).toFixed(2);
    const unit = ["B", "kiB", "MiB", "GiB", "TiB"][i];
    return `${value} ${unit}`;
}
