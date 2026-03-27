import { InputComponent } from "./inputComponent.ts";
import { BackendComm } from "../../comm.ts";
import { TextInput } from "./textInput.ts";
import { FileInput } from "./fileInput.ts";
import { Attachment } from "../../models.ts";

/**
 * Input component for an attachment.
 */
export class AttachmentInput extends InputComponent<Attachment> {
    private readonly fileInput: FileInput;
    private readonly captionInput: TextInput;

    constructor(key: string, comm: BackendComm) {
        const fileInput = new FileInput(key, comm, { required: true });
        const captionInput = new TextInput(key, {});
        const container = document.createElement("fieldset");
        container.classList.add("cean-attachment");
        container.append(fileInput.container, captionInput.container);

        super(key, container, {});
        this.fileInput = fileInput;
        this.captionInput = captionInput;
        // Delegate to fileInput for validation (caption input is always valid)
        this.isValid = () => this.fileInput.isValid();
    }

    destroy() {
        this.fileInput.destroy();
        // TODO
    }

    get id(): string {
        return this.fileInput.id;
    }

    get value(): Attachment | null {
        const path = this.fileInput.value;
        if (path) {
            return {
                localPath: path,
                caption: this.captionInput.value ?? this.captionInput.placeholder,
            };
        } else {
            return null;
        }
    }

    setSilent(value: Attachment | null) {
        if (value === null) {
            this.fileInput.setSilent(null);
            this.captionInput.setSilent(null);
        } else {
            this.fileInput.setSilent(value.localPath);
            this.captionInput.setSilent(value.caption || null);
        }
    }
}
