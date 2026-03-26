import { InputComponent, MultiFileInput } from "../components/input";
import { createLabelFor } from "./util.ts";
import { humanSize } from "../components";

export class Files {
    readonly element: HTMLDivElement;
    private readonly summary = new Summary();

    constructor(
        inputs: Map<string, InputComponent<unknown>>,
        showSourceFolder: boolean,
    ) {
        this.element = document.createElement("div");
        this.element.append(this.summary.element);

        if (showSourceFolder) {
            const sourceFolder = createSourceFolderElement(inputs);
            if (sourceFolder) this.element.append(sourceFolder);
        }

        const filesInput = inputs.get("files") as MultiFileInput;
        if (filesInput) {
            this.element.append(filesInput.container);
            filesInput.container.addEventListener("input-updated", () => {
                this.summary.nFiles = filesInput.nFiles;
                this.summary.totalSize = filesInput.totalSize;
            });
            // Initial update
            this.summary.nFiles = filesInput.nFiles;
            this.summary.totalSize = filesInput.totalSize;
        } else {
            this.element.append(document.createTextNode("Input 'files' not found"));
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
