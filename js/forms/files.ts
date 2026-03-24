import { BackendComm } from "../comm.ts";
import { humanSize, removeButton } from "../components";
import { FileInput, InputComponent, TextInput } from "../components/input";
import { createLabelFor } from "./util.ts";

export class Files {
    readonly element: HTMLDivElement;
    private readonly summary = new Summary();
    private readonly filesContainer: HTMLFieldSetElement;
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
        // TODO
        // this.summary.nFiles = this.files.length;
        // this.summary.totalSize = this.totalSize;
    }

    private addFileInput() {
        this.filesContainer.append(
            createFileInput(this.comm, () => {
                this.onInputRemoved();
            }),
        );
    }

    private onInputRemoved() {
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
    onInputRemoved: () => void,
): HTMLFieldSetElement {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "cean-single-file-input";

    const localPathInput = new FileInput("localPath", comm, {});
    const localPathLabel = createLabelFor(localPathInput);

    const remotePathInput = new TextInput("remotePath", {});
    const remotePathLabel = createLabelFor(remotePathInput);

    const inputContainer = document.createElement("div");
    inputContainer.classList.add("cean-input-grid");
    inputContainer.append(
        localPathLabel,
        localPathInput.container,
        remotePathLabel,
        remotePathInput.container,
    );

    const button = removeButton(() => {
        fieldset.remove();
        onInputRemoved();
    });

    fieldset.append(inputContainer, button);
    return fieldset;
}
