import { File } from "../../models.ts";
import { BackendComm } from "../../comm.ts";
import { removeButton } from "../index.ts";
import { FileInput, InputComponent, TextInput } from "./index.ts";
import { InputOptions } from "./inputComponent.ts";
import { createLabel, createLabelFor, pathOutput } from "../../forms";
import { iconForFileType } from "../labIcon.ts";

export class MultiFileInput extends InputComponent<File[]> {
    private readonly newFileInput: FileInput;
    private readonly selectedContainer: HTMLDivElement;
    private readonly selectedFiles: {
        localPath: HTMLOutputElement;
        remotePathInput: TextInput;
        size: number;
    }[] = [];

    constructor(key: string, comm: BackendComm, options: InputOptions<File[]>) {
        const [container, newFileInput, selectedContainer] = createBaseStructure(
            key,
            comm,
        );

        super(key, container, options);
        this.newFileInput = newFileInput;
        this.selectedContainer = selectedContainer;

        this.newFileInput.container.addEventListener("input-updated", (() => {
            const localPath = this.newFileInput.value;
            const data = this.newFileInput.inspectionResult;
            if (localPath === null || data === null) return;
            this.addFileItem({
                localPath,
                remotePath: data.remotePath,
                type: data.type,
                size: data.size,
            });
            this.newFileInput.setSilent(null);
        }) as EventListener);
    }

    destroy() {
        this.newFileInput.destroy();
    }

    get value(): File[] {
        return this.selectedFiles
            .map((item) => {
                const localPath = item.localPath.value;
                return {
                    localPath: localPath,
                    remotePath: item.remotePathInput.value ?? undefined,
                };
            })
            .filter((v) => v) as File[];
    }

    get nFiles(): number {
        return this.selectedFiles.length;
    }

    get totalSize(): number {
        return this.selectedFiles.reduce((sum, item) => sum + (item.size ?? 0), 0);
    }

    setSilent(value: File[] | null) {
        // Clear current inputs
        this.selectedFiles.splice(0, this.selectedFiles.length);
        this.selectedContainer.replaceChildren();

        if (value && value.length > 0) {
            for (const file of value) {
                this.addFileItem(file);
            }
        }
    }

    private addFileItem(file: File) {
        const [container, localPath, remotePathInput] = createFileItem((p) => {
            this.onInputRemoved(p);
        }, file);

        this.selectedFiles.push({ localPath, remotePathInput, size: file.size ?? 0 });
        this.selectedContainer.append(container);
    }

    private onInputRemoved(localPath: HTMLOutputElement) {
        const index = this.selectedFiles.findIndex(
            (item) => item.localPath === localPath,
        );
        if (index !== -1) {
            this.selectedFiles.splice(index, 1);
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

function createFileItem(
    onInputRemoved: (x: HTMLOutputElement) => void,
    file: File,
): [HTMLFieldSetElement, HTMLOutputElement, TextInput] {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "cean-selected-file-item";

    const localPath = pathOutput(file.localPath);
    const localPathLabel = createLabel(localPath, "localPath");

    const remotePathInput = new TextInput("remotePath", {});
    remotePathInput.placeholder = file.remotePath ?? "";
    const remotePathLabel = createLabelFor(remotePathInput);

    const inputContainer = document.createElement("div");
    inputContainer.classList.add("cean-input-grid");
    inputContainer.append(
        localPathLabel,
        localPath,
        remotePathLabel,
        remotePathInput.container,
    );

    const button = removeButton(() => {
        fieldset.remove();
        onInputRemoved(localPath);
    });

    const el = document.createElement("i");
    el.classList.add("cean-file-icon");
    iconForFileType(file.type).element({
        container: el,
        width: "2em",
        height: "2em",
    });

    fieldset.append(el, inputContainer, button);
    return [fieldset, localPath, remotePathInput];
}
