import { BackendComm } from "../comm.ts";
import { humanSize, removeButton } from "../components";
import { FileInput, InputComponent, TextInput } from "../components/input";
import { createLabelFor } from "./util.ts";

export class Files {
    readonly element: HTMLDivElement;
    private readonly summary = new Summary();
    private readonly filesContainer: HTMLFieldSetElement;
    private readonly fileInputs: FileInput[] = [];
    private readonly comm: BackendComm;

    constructor(
        inputs: Map<string, InputComponent<unknown>>,
        comm: BackendComm,
        showSourceFolder: boolean,
    ) {
        this.element = document.createElement("div");
        this.element.append(this.summary.element);

        if (showSourceFolder) {
            const sourceFolder = createSourceFolderElement(inputs);
            if (sourceFolder) this.element.append(sourceFolder);
        }

        this.filesContainer = createFilesContainer();
        this.element.append(this.filesContainer);

        this.comm = comm;

        this.addFileInput();
    }

    private updateSummary() {
        const files = this.fileInputs.filter((f) => f.value);
        this.summary.totalSize = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
        this.summary.nFiles = files.length;
    }

    private addFileInput() {
        const [container, fileInput, remotePathInput] = createFileInput(
            this.comm,
            (x) => {
                this.onInputRemoved(x);
            },
        );
        container.addEventListener("input-updated", () => {
            this.updateSummary();
            if (this.fileInputs[this.fileInputs.length - 1].value) {
                this.addFileInput();
            }
        });
        fileInput.container.addEventListener("file-inspected", (e: Event) => {
            const event = e as CustomEvent;
            const payload = event.detail.payload;
            remotePathInput.placeholder = payload.remotePath ?? null;
        });
        this.fileInputs.push(fileInput);
        this.filesContainer.append(container);
    }

    private onInputRemoved(fileInput: FileInput) {
        fileInput.destroy();
        this.fileInputs.splice(this.fileInputs.indexOf(fileInput), 1);
        this.updateSummary();
        if (
            this.filesContainer.querySelectorAll(".cean-single-file-input").length === 0
        ) {
            this.addFileInput();
        }
    }
}

class Summary {
    readonly element: HTMLDivElement;
    private readonly nFilesElement: HTMLOutputElement;
    private readonly totalSizeElement: HTMLOutputElement;

    constructor() {
        const nFilesLabel = document.createElement("span");
        nFilesLabel.textContent = "Files";

        this.nFilesElement = document.createElement("output");
        this.nFilesElement.textContent = "0";

        const sizeLabel = document.createElement("span");
        sizeLabel.textContent = "Total Size:";

        this.totalSizeElement = document.createElement("output");
        this.totalSizeElement.replaceChildren(humanSize(0));

        this.element = document.createElement("div");
        this.element.classList.add("cean-files-summary");
        this.element.append(
            nFilesLabel,
            this.nFilesElement,
            sizeLabel,
            this.totalSizeElement,
        );
    }

    set nFiles(n: number) {
        this.nFilesElement.textContent = n.toString();
    }

    set totalSize(size: number) {
        this.totalSizeElement.replaceChildren(humanSize(size));
    }
}

function createSourceFolderElement(
    inputs: Map<string, InputComponent<unknown>>,
): HTMLFieldSetElement | null {
    const sourceFolder = inputs.get("sourceFolder");
    if (!sourceFolder) {
        console.error("Input sourceFolder not found");
        return null;
    }

    const label = createLabelFor(sourceFolder);

    const fieldset = document.createElement("fieldset");
    fieldset.classList.add("cean-input-grid");
    fieldset.append(label, sourceFolder.container);
    return fieldset;
}

function createFilesContainer(): HTMLFieldSetElement {
    const label = document.createElement("div");
    label.textContent = "Files";

    const container = document.createElement("fieldset");
    container.classList.add("cean-files-container");
    container.appendChild(label);
    return container;
}

function createFileInput(
    comm: BackendComm,
    onInputRemoved: (x: FileInput) => void,
): [HTMLFieldSetElement, FileInput, TextInput] {
    const baseId = crypto.randomUUID();

    const fieldset = document.createElement("fieldset");
    fieldset.className = "cean-single-file-input";

    const fileInput = new FileInput("localPath", comm, {});
    const localPathLabel = createLabelFor(fileInput);

    const remotePathInput = new TextInput("remotePath", {});
    const remotePathLabel = createLabelFor(remotePathInput);

    const inputContainer = document.createElement("div");
    inputContainer.classList.add("cean-input-grid");
    inputContainer.append(
        localPathLabel,
        fileInput.container,
        remotePathLabel,
        remotePathInput.container,
    );

    const button = removeButton(() => {
        fieldset.remove();
        onInputRemoved(fileInput);
    });

    fieldset.append(inputContainer, button);
    return [fieldset, fileInput, remotePathInput];
}
