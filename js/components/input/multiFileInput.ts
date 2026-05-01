import { File } from "../../models.ts";
import { BackendComm } from "../../comm.ts";
import { removeButton } from "../index.ts";
import { FileInput, InputComponent, TextInput } from "./index.ts";
import { InputOptions } from "./inputComponent.ts";
import { createLabelFor } from "../../forms";
import { iconForFileType } from "../labIcon.ts";

export class MultiFileInput extends InputComponent<File[]> {
    private readonly newFileInput: FileInput;
    private readonly selectedContainer: HTMLDivElement;
    private readonly fileInputs: {
        fileInput: FileInput;
        remotePathInput: TextInput;
    }[] = [];
    private readonly comm: BackendComm;

    constructor(key: string, comm: BackendComm, options: InputOptions<File[]>) {
        const [container, newFileInput, selectedContainer] = createBaseStructure(
            key,
            comm,
        );

        super(key, container, options);
        this.newFileInput = newFileInput;
        this.selectedContainer = selectedContainer;
        this.comm = comm;

        this.newFileInput.container.addEventListener("input-updated", (() => {
            const localPath = this.newFileInput.value;
            const data = this.newFileInput.inspectionResult;
            if (localPath === null || data === null) return;
            this.addFileInput({
                localPath,
                remotePath: data.remotePath,
                type: data.type,
            });
            this.newFileInput.setSilent(null);
        }) as EventListener);
    }

    destroy() {
        // TODO call from parent
        this.newFileInput.destroy();
        for (const fi of this.fileInputs) {
            fi.fileInput.destroy();
        }
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

    setSilent(value: File[] | null) {
        // Clear current inputs
        while (this.fileInputs.length > 0) {
            const fi = this.fileInputs.pop()!;
            fi.fileInput.destroy();
        }
        this.selectedContainer.replaceChildren();

        if (value && value.length > 0) {
            for (const file of value) {
                this.addFileInput(file);
            }
        }
    }

    private addFileInput(initialValue: File) {
        const [container, fileInput, remotePathInput] = createFileInput(
            this.comm,
            (fi) => {
                this.onInputRemoved(fi);
            },
            initialValue,
        );

        container.addEventListener("input-updated", () => {
            this.updated();
        });

        fileInput.container.addEventListener("file-inspected", (e: Event) => {
            const event = e as CustomEvent;
            const payload = event.detail.payload;
            remotePathInput.placeholder = payload.remotePath ?? null;
        });

        this.fileInputs.push({ fileInput, remotePathInput });
        this.selectedContainer.append(container);
    }

    private onInputRemoved(fileInput: FileInput) {
        const index = this.fileInputs.findIndex((fi) => fi.fileInput === fileInput);
        if (index !== -1) {
            this.fileInputs[index].fileInput.destroy();
            this.fileInputs.splice(index, 1);
        }
        this.updated();
    }
}

function createBaseStructure(
    key: string,
    comm: BackendComm,
): [HTMLFieldSetElement, FileInput, HTMLDivElement] {
    const newFileInput = new FileInput(`${key}-newFile`, comm, {});
    const newFileLabel = createLabelFor(newFileInput, "Input new file");

    const selectedLabel = document.createElement("div");
    selectedLabel.textContent = "Selected files";

    const selectedContainer = document.createElement("div");

    const fieldset = document.createElement("fieldset");
    fieldset.classList.add("cean-muli-file-input");
    fieldset.append(
        newFileLabel,
        newFileInput.container,
        selectedLabel,
        selectedContainer,
    );
    return [fieldset, newFileInput, selectedContainer];
}

function createFileInput(
    comm: BackendComm,
    onInputRemoved: (x: FileInput) => void,
    file: File,
): [HTMLFieldSetElement, FileInput, TextInput] {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "cean-single-file-input";

    const fileInput = new FileInput("localPath", comm, {});
    fileInput.setSilent(file.localPath);
    const localPathLabel = createLabelFor(fileInput);

    const remotePathInput = new TextInput("remotePath", {});
    remotePathInput.placeholder = file.remotePath ?? "";
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

    const el = document.createElement("i");
    el.classList.add("cean-file-icon");
    iconForFileType(file.type).element({
        container: el,
        width: "2em",
        height: "2em",
    });

    fieldset.append(el, inputContainer, button);
    return [fieldset, fileInput, remotePathInput];
}
