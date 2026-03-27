import { InputComponent } from "./inputComponent.ts";
import { Attachment } from "../../models.ts";
import { BackendComm } from "../../comm.ts";

export class MultiAttachmentInput extends InputComponent<Attachment[]> {
    constructor(key: string, comm: BackendComm) {
        const container = document.createElement("div");
        container.classList.add("cean-attachments");
        super(key, container, {});
    }

    destroy() {
        // TODO call children
        // TODO cal lthis from parent
    }
}
