import { FileInputWidget, InputWidget, StringInputWidget } from "./inputWidgets.ts";
import { removeButton } from "./widgets/button.ts";
import { createInputWithLabel } from "./forms.ts";
import { humanSize } from "./widgets/output.ts";
import { BackendComm } from "./comm.ts";
import { GatherResult } from "./widgets/upload.ts";
import { Instrument } from "./models.ts";

export class FilesWidget {
    readonly element: HTMLDivElement;
    private readonly comm: BackendComm;
    private readonly fileWidgets: SingleFileWidget[] = [];
    private readonly sourceFolderInput: InputWidget<string>;
    private nFilesTabElement: HTMLSpanElement;
    private nFilesElement!: HTMLSpanElement;
    private totalSizeElement!: HTMLSpanElement;
    private widgetsContainer!: HTMLElement;

    constructor(
        comm: BackendComm,
        nFilesTabElement: HTMLSpanElement,
        instruments: [Instrument],
        topContainer: HTMLElement,
    ) {
        this.comm = comm;
        this.nFilesTabElement = nFilesTabElement;

        const element = document.createElement("div");
        element.classList.add("cean-files-widget");

        element.appendChild(this.createSummary());
        const [sourceFolderSection, folder] = createSourceFolderInput(
            instruments,
            topContainer,
        );
        this.sourceFolderInput = folder;
        element.appendChild(sourceFolderSection);
        element.appendChild(this.createFileWidgets());

        this.element = element;
    }

    gatherData(): GatherResult {
        const data = {
            sourceFolder: this.sourceFolderInput.value,
            files: this.fileWidgets
                .filter((widget) => widget.fileExists())
                .map((widget) => {
                    return {
                        localPath: widget.localPath,
                        remotePath: widget.remotePath,
                    };
                })
                .filter((v) => v.localPath),
        };
        // TODO validation
        return { validationErrors: false, data };
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
        this.totalSizeElement.replaceChildren(humanSize(size));
    }

    private createSummary() {
        const container = document.createElement("section");
        container.classList.add("cean-files-summary");

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
        this.totalSizeElement.replaceChildren(humanSize(0));
        container.appendChild(this.totalSizeElement);

        return container;
    }

    private createFileWidgets() {
        this.widgetsContainer = document.createElement("section");
        this.widgetsContainer.classList.add("cean-files-container", "cean-input-panel");

        const label = document.createElement("div");
        label.textContent = "Files";
        this.widgetsContainer.appendChild(label);

        this.addFileWidget();

        return this.widgetsContainer;
    }

    private addFileWidget() {
        const widget = new SingleFileWidget(
            this.comm,
            () => {
                this.updateSummary();
                if (
                    widget === this.fileWidgets[this.fileWidgets.length - 1] &&
                    widget.localPath !== null
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
    private readonly localPathInput: FileInputWidget;
    private readonly remotePathInput: StringInputWidget;
    private readonly removeButton: HTMLButtonElement;

    constructor(comm: BackendComm, onChange: () => void, onRemove: () => void) {
        this.key = crypto.randomUUID();
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add("cean-single-file-widget", "cean-input-grid");

        const [localPathLabel, localPathInput] = createInputWithLabel(
            `${this.key}_localPath`,
            FileInputWidget,
            [comm],
            "Path",
        );
        this.localPathInput = localPathInput as FileInputWidget;
        this.localPathInput.container.addEventListener("input-updated", () => {
            onChange();
        });
        this.element.appendChild(localPathLabel);
        this.element.appendChild(this.localPathInput.container);

        this.removeButton = removeButton(() => {
            this.remove();
            onRemove();
        });
        this.removeButton.setAttribute("disabled", "true");
        this.element.appendChild(this.removeButton);

        const [remotePathLabel, remotePathInput] = createInputWithLabel(
            `${this.key}_remotePath`,
            StringInputWidget,
            [],
            "Remote path",
        );
        this.remotePathInput = remotePathInput as StringInputWidget;
        this.element.appendChild(remotePathLabel);
        this.element.appendChild(remotePathInput.container);

        this.localPathInput.container.addEventListener("file-inspected", (e: Event) => {
            const event = e as CustomEvent;
            const payload = event.detail.payload;
            if (payload.success) {
                this.remotePathInput.placeholder = payload.remotePath;
            } else {
                this.remotePathInput.placeholder = null;
            }
        });
        this.localPathInput.container.addEventListener("input", (e: Event) => {
            if (!(e.target as HTMLInputElement).value) {
                this.remotePathInput.placeholder = null;
            }
        });
    }

    get localPath(): string | null {
        return this.localPathInput.value?.trim() ?? null;
    }

    get remotePath(): string | null {
        return this.remotePathInput.value?.trim() ?? null;
    }

    get size(): number | null {
        return this.localPathInput.size;
    }

    fileExists(): boolean {
        return this.size !== null;
    }

    setRemoveDisabled(disabled: boolean) {
        if (disabled) {
            this.removeButton.setAttribute("disabled", "true");
        } else {
            this.removeButton.removeAttribute("disabled");
        }
    }

    private remove() {
        this.element.remove();
        this.localPathInput.destroy();
    }
}

function createSourceFolderInput(
    instruments: [Instrument],
    topContainer: HTMLElement,
): [HTMLElement, InputWidget<string>] {
    const section = document.createElement("section");
    section.style.gridTemplateColumns = "max-content 1fr";
    section.classList.add("cean-input-grid", "cean-input-panel");

    const [sourceFolderLabel, sourceFolderInput] = createInputWithLabel(
        "sourceFolder",
        StringInputWidget,
        [{ required: true }],
    );
    section.appendChild(sourceFolderLabel);
    section.appendChild(sourceFolderInput.container);

    const listener = {
        proposalId: null as string | null,
        instrumentName: null as string | null,
        listenToProposal(widget: InputWidget<string>, proposalId: string | null) {
            this.proposalId = proposalId;
            this.setSourceFolder(widget);
        },
        listenToInstrument(widget: InputWidget<string>, instrumentId: string | null) {
            this.instrumentName =
                instruments.find((i) => i.id === instrumentId)?.name ?? null;
            this.setSourceFolder(widget);
        },
        setSourceFolder(widget: InputWidget<string>) {
            if (this.proposalId && this.instrumentName) {
                widget.value = `/ess/data/${this.instrumentName.toLowerCase()}/${this.proposalId}/upload`;
            }
        },
    };

    sourceFolderInput.listenToWidget(
        "proposalId",
        (w, p) => {
            listener.listenToProposal(w, p as string | null);
        },
        topContainer,
    );
    sourceFolderInput.listenToWidget(
        "instrumentId",
        (w, p) => {
            listener.listenToInstrument(w, p as string | null);
        },
        topContainer,
    );

    return [section, sourceFolderInput];
}
