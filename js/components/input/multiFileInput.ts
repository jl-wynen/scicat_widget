import { File } from "../../models.ts";
import { BackendComm } from "../../comm.ts";
import { removeButton } from "../index.ts";
import { FileInput, InputComponent, TextInput } from "./index.ts";
import { InputOptions } from "./inputComponent.ts";
import { createLabelFor } from "../../forms";

export class MultiFileInput extends InputComponent<File[]> {
    private readonly filesContainer: HTMLFieldSetElement;
    private readonly fileInputs: {
        fileInput: FileInput;
        remotePathInput: TextInput;
    }[] = [];
    private readonly comm: BackendComm;

    constructor(key: string, comm: BackendComm, options: InputOptions<File[]>) {
        const filesContainer = createFilesContainer();

        super(key, filesContainer, options);

        this.filesContainer = filesContainer;
        this.comm = comm;

        this.addFileInput();
    }

    get value(): File[] {
        return this.fileInputs
            .map((fi) => {
                const localPath = fi.fileInput.value;
                if (!localPath) return null;
                return {
                    localPath: localPath,
                    remotePath: fi.remotePathInput.value ?? undefined,
                };
            })
            .filter((v) => v) as File[];
    }

    get nFiles(): number {
        return this.fileInputs.filter((fi) => fi.fileInput.value).length;
    }

    get totalSize(): number {
        return this.fileInputs
            .filter((fi) => fi.fileInput.value)
            .reduce((sum, fi) => sum + (fi.fileInput.size ?? 0), 0);
    }

    setSilent(value: File[] | null): void {
        // Clear current inputs
        while (this.fileInputs.length > 0) {
            const fi = this.fileInputs.pop()!;
            fi.fileInput.destroy();
        }
        this.filesContainer.replaceChildren();

        const label = document.createElement("div");
        label.textContent = "Files";
        this.filesContainer.appendChild(label);

        if (value && value.length > 0) {
            for (const file of value) {
                this.addFileInput(file);
            }
        }
        this.addFileInput();
    }

    private addFileInput(initialValue?: File) {
        const [container, fileInput, remotePathInput] = createFileInput(
            this.comm,
            (fi) => {
                this.onInputRemoved(fi);
            },
        );

        if (initialValue) {
            fileInput.setSilent(initialValue.localPath);
            remotePathInput.setSilent(initialValue.remotePath ?? null);
        }

        container.addEventListener("input-updated", () => {
            // Ensure that there always is 1 empty input at the end.
            if (this.fileInputs[this.fileInputs.length - 1].fileInput.value) {
                this.addFileInput();
            }
            this.updated();
        });

        fileInput.container.addEventListener("file-inspected", (e: Event) => {
            const event = e as CustomEvent;
            const payload = event.detail.payload;
            remotePathInput.placeholder = payload.remotePath ?? null;
        });

        this.fileInputs.push({ fileInput, remotePathInput });
        this.filesContainer.append(container);
    }

    private onInputRemoved(fileInput: FileInput) {
        const index = this.fileInputs.findIndex((fi) => fi.fileInput === fileInput);
        if (index !== -1) {
            this.fileInputs[index].fileInput.destroy();
            this.fileInputs.splice(index, 1);
        }
        if (
            this.filesContainer.querySelectorAll(".cean-single-file-input").length === 0
        ) {
            this.addFileInput();
        }
        this.updated();
    }
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
