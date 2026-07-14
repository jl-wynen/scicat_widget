import { InputComponent, InputOptions, UpdateEvent } from "./inputComponent.ts";
import { Attachment } from "../../models.ts";
import { BackendComm, ResLoadImage } from "../../comm.ts";
import { FileInput } from "./fileInput.ts";
import { createLabelFor, pathOutput } from "../../forms";
import { TextInput } from "./textInput.ts";
import { removeButton } from "../button.ts";

export class MultiAttachmentInput extends InputComponent<Attachment[]> {
    private readonly newAttachmentInput: FileInput;
    private readonly errorOutput: HTMLOutputElement;
    private readonly attachmentsContainer: HTMLDivElement;
    private readonly attachments: AttachmentView[];
    private readonly comm: BackendComm;

    constructor(key: string, comm: BackendComm, options: InputOptions<Attachment[]>) {
        const [container, newAttachmentInput, errorOutput, attachmentsContainer] =
            createBaseStructure(key, comm);

        super(key, container, options);
        this.newAttachmentInput = newAttachmentInput;
        this.errorOutput = errorOutput;
        this.attachmentsContainer = attachmentsContainer;
        this.attachments = [];
        this.comm = comm;

        this.newAttachmentInput.container.addEventListener("input-updated", ((
            event: UpdateEvent,
        ) => {
            // Do not signal update until the file has been loaded.
            event.stopPropagation();

            const data = this.newAttachmentInput.inspectionResult;
            if (data === null) return;
            if (data.success) {
                this.loadImage(data.filename);
            }
        }) as EventListener);

        this.comm.onResLoadImage(this.key, (response) => {
            this.handleLoadImage(response);
        });
    }

    destroy() {
        this.comm.offResLoadImage(this.key);
    }

    setSilent(value: Attachment[] | null) {
        this.clear();
        for (const attachment of value || []) {
            this.addAttachment(null, attachment.data, attachment.caption);
        }
    }

    get value(): Attachment[] | null {
        return (
            this.attachments.map((view) => {
                const [data, caption] = view.value;
                return { data, caption };
            }) || null
        );
    }

    get nAttachments(): number {
        return this.attachments.length;
    }

    get id(): string {
        return this.newAttachmentInput.id;
    }

    private clear() {
        this.attachmentsContainer.replaceChildren();
        this.attachments.splice(0, this.attachments.length);
        this.newAttachmentInput.setSilent(null);
        this.errorOutput.value = "";
    }

    private loadImage(path: string, caption?: string) {
        this.comm.sendReqLoadImage(this.key, { path, caption });
        this.errorOutput.value = "";
    }

    private handleLoadImage(response: ResLoadImage) {
        if (response.error) {
            this.errorOutput.value = `Failed to load file '${response.path}': ${response.error}`;
        } else if (!response.image) {
            this.errorOutput.value = `Failed to load file '${response.path}': Received no image`;
        } else {
            this.addAttachment(response.path, response.image, response.caption ?? "");
        }
        this.updated();
    }

    private addAttachment(
        path: string | null,
        data: string,
        caption: string | undefined,
    ) {
        this.newAttachmentInput.setSilent(null);
        const view = new AttachmentView(
            path,
            data,
            caption ?? "",
            this.removeAttachment.bind(this),
        );
        this.attachments.push(view);
        this.attachmentsContainer.append(view.container);
    }

    private removeAttachment(view: AttachmentView) {
        const index = this.attachments.indexOf(view);
        if (index !== -1) {
            this.attachments.splice(index, 1);
        }
        this.updated();
    }
}

class AttachmentView {
    readonly container: HTMLFieldSetElement;
    private readonly data: string;
    private readonly captionInput: TextInput;

    constructor(
        path: string | null,
        data: string,
        caption: string,
        onRemove: (view: AttachmentView) => void,
    ) {
        this.data = data;

        const pathField = pathOutput(path ?? "<unknown>");

        const pathLabel = document.createElement("label");
        pathLabel.setAttribute("for", pathField.id);
        pathLabel.textContent = "Path";

        this.captionInput = new TextInput(crypto.randomUUID(), {
            placeholder: caption,
        });
        const captionLabel = createLabelFor(
            this.captionInput,
            "Caption",
            "Caption for the attachment",
        );

        const imageContainer = document.createElement("div");
        imageContainer.classList = "cean-image-container";
        imageContainer.append(makeImg(data));

        const button = removeButton(() => {
            onRemove(this);
            this.container.remove();
        });

        this.container = document.createElement("fieldset");
        this.container.classList.add("cean-attachment-view");
        this.container.append(
            pathLabel,
            pathField,
            captionLabel,
            this.captionInput.container,
            imageContainer,
            button,
        );
    }

    get value(): [string, string] {
        return [this.data, this.captionInput.value || this.captionInput.placeholder];
    }
}

function makeImg(src: string): HTMLImageElement | HTMLDivElement {
    if (src.startsWith("data:image/")) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Image";
        return img;
    } else {
        const placeholder = document.createElement("div");
        placeholder.classList = "cean-bad-image-placeholder";
        placeholder.textContent = "Cannot display image";
        return placeholder;
    }
}

function createBaseStructure(
    key: string,
    comm: BackendComm,
): [HTMLFieldSetElement, FileInput, HTMLOutputElement, HTMLDivElement] {
    const newAttachmentInput = new FileInput(`${key}-newFile`, comm, {});
    const newAttachmentLabel = createLabelFor(
        newAttachmentInput,
        "Input new attachment",
    );

    const errorOutput = document.createElement("output");
    errorOutput.classList.add("cean-error");

    const selectedLabel = document.createElement("div");
    selectedLabel.textContent = "Selected attachments:";

    const selectedContainer = document.createElement("div");
    selectedContainer.classList = "cean-attachment-grid";

    const fieldset = document.createElement("fieldset");
    fieldset.classList.add("cean-multi-attachment-input");
    fieldset.append(
        newAttachmentLabel,
        newAttachmentInput.container,
        errorOutput,
        selectedLabel,
        selectedContainer,
    );
    return [fieldset, newAttachmentInput, errorOutput, selectedContainer];
}
