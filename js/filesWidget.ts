import type { AnyModel } from "@anywidget/types";
import { DropdownInputWidget, FileInputWidget, InputWidget, StringInputWidget } from "./inputWidgets.ts";
import { removeButton } from "./widgets/iconButton.ts";
import { createInputWithLabel } from "./forms.ts";

export class FilesWidget {
    element: HTMLDivElement;
    private readonly model: AnyModel<object>;
    private readonly fileWidgets: SingleFileWidget[] = [];
    private readonly sourceFolderInput: InputWidget<string>;
    private readonly algInput: InputWidget<string>;
    private nFilesTabElement: HTMLSpanElement;
    private nFilesElement!: HTMLSpanElement;
    private totalSizeElement!: HTMLSpanElement;
    private widgetsContainer!: HTMLDivElement;

    constructor(model: AnyModel<object>, nFilesTabElement: HTMLSpanElement) {
        this.model = model;
        this.nFilesTabElement = nFilesTabElement;

        const element = document.createElement("div");
        element.classList.add("cean-files-widget");

        element.appendChild(this.createSummary());
        const [generalContainer, folder, alg] = createGeneralInputs();
        this.sourceFolderInput = folder;
        this.algInput = alg;
        element.appendChild(generalContainer);
        element.appendChild(this.createFileWidgets());

        this.element = element;
    }

    gatherData(): Record<string, any> {
        return {
            sourceFolder: this.sourceFolderInput.value,
            checksumAlgorithm: this.algInput.value,
            files: this.fileWidgets
                .filter((widget) => widget.fileExists())
                .map((widget) => widget.value)
                .filter((v) => v),
        };
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
        this.widgetsContainer = document.createElement("div");

        const label = document.createElement("div");
        label.textContent = "Files";
        this.widgetsContainer.appendChild(label);

        this.addFileWidget();

        return this.widgetsContainer;
    }

    private addFileWidget() {
        const widget = new SingleFileWidget(
            this.model,
            () => this.updateSummary(),
            () => {
                if (
                    widget === this.fileWidgets[this.fileWidgets.length - 1] &&
                    widget.value !== null
                ) {
                    this.addFileWidget();
                }
            },
            () => this.removeFileWidget(widget),
        );
        this.widgetsContainer.appendChild(widget.element);
        this.fileWidgets.push(widget);
        this.updateRemoveButtonsState();
    }

    private removeFileWidget(widget: SingleFileWidget) {
        const index = this.fileWidgets.indexOf(widget);
        if (index !== -1) {
            this.fileWidgets.splice(index, 1);
        }
        this.updateSummary();
        this.updateRemoveButtonsState();
    }

    private updateRemoveButtonsState() {
        this.fileWidgets.forEach((widget, index) => {
            const isLast = index === this.fileWidgets.length - 1;
            widget.setRemoveDisabled(isLast);
        });
    }
}

class SingleFileWidget {
    readonly key: string;
    readonly element: HTMLDivElement;
    private readonly input: FileInputWidget;
    private readonly responseHandler: (response: any) => void;
    private size_: number | null = null;
    private creationTime_: Date | null = null;

    private readonly removeButton: HTMLButtonElement;

    constructor(
        model: AnyModel<object>,
        onChange: () => void,
        onInput: () => void,
        onRemove: () => void,
    ) {
        // TODO add input of remote name
        this.key = crypto.randomUUID();
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add("cean-single-file-widget");
        this.element.classList.add("cean-input-grid");

        this.input = new FileInputWidget(this.key);
        this.input.container.classList.add("cean-file-input");
        this.element.appendChild(this.input.container);

        this.removeButton = removeButton(() => {
            this.remove(model);
            onRemove();
        });
        this.removeButton.setAttribute("disabled", "true");
        this.element.appendChild(this.removeButton);

        const stats = document.createElement("div");
        stats.classList.add("cean-file-stats");
        this.element.appendChild(stats);

        this.responseHandler = (message: any) => {
            if (message.type !== "rsp:inspect-file") return;
            const payload = message.payload;
            if (payload.key !== this.key) return;

            this.renderFileStats(payload, stats);
            onChange();
        };
        model.on("msg:custom", this.responseHandler);

        this.input.container.addEventListener("input-updated", () => {
            onInput();
            if (!this.value) {
                stats.replaceChildren();
                this.size_ = null;
                this.creationTime_ = null;
                onChange();
                return;
            } else {
                model.send({
                    type: "req:inspect-file",
                    payload: {
                        filename: this.value,
                        key: this.key, // To identify responses for this input element.
                    },
                });
            }
        });
    }

    get value(): string | null {
        return this.input.value?.trim() ?? null;
    }

    get size(): number | null {
        return this.size_;
    }

    get creationTime(): Date | null {
        return this.creationTime_;
    }

    fileExists(): boolean {
        return this.size_ !== null;
    }

    setRemoveDisabled(disabled: boolean) {
        if (disabled) {
            this.removeButton.setAttribute("disabled", "true");
        } else {
            this.removeButton.removeAttribute("disabled");
        }
    }

    private remove(model: AnyModel<object>) {
        this.element.remove();
        model.off("msg:custom", this.responseHandler);
    }

    private renderFileStats(payload: any, stats: HTMLDivElement) {
        if (payload.success) {
            this.size_ = payload.size;
            this.creationTime_ = new Date(payload.creationTime);

            delete this.input.container.dataset.error;

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

            this.input.container.dataset["error"] = "true";

            const span = document.createElement("span");
            span.textContent = payload.error;
            stats.replaceChildren(span);
        }
    }
}

function createGeneralInputs(): [
    HTMLElement,
    InputWidget<string>,
    InputWidget<string>,
] {
    const container = document.createElement("div");
    container.style.gridTemplateColumns = "max-content 1fr";
    container.classList.add("cean-input-grid");

    const [sourceFolderLabel, sourceFolderInput] = createInputWithLabel(
        "Source folder",
        StringInputWidget,
        [{ required: true }],
    );
    container.appendChild(sourceFolderLabel);
    container.appendChild(sourceFolderInput.container);

    const [algLabel, algInput] = createInputWithLabel(
        "checksumAlgorithm",
        DropdownInputWidget,
        [CHECKSUM_ALGORITHMS],
    );
    algInput.container.classList.add("cean-chk-alg");
    container.appendChild(algLabel);
    container.appendChild(algInput.container);

    return [container, sourceFolderInput, algInput];
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
