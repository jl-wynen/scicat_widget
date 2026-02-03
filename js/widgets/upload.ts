import { BackendComm } from "../comm";
import { simpleLink } from "./output.ts";
import { textButton } from "./button.ts";
import { Dialog } from "./dialog.ts";

export class UploadWidget {
    private readonly comm: BackendComm;
    private readonly scicatUrl: string;
    private readonly skipConfirmation: boolean;
    private readonly gatherData: () => GatherResult;

    private readonly key = crypto.randomUUID();
    private dialog: Dialog;

    constructor(
        comm: BackendComm,
        scicatUrl: string,
        skipConfirmation: boolean,
        gatherData: () => GatherResult,
    ) {
        this.comm = comm;
        this.scicatUrl = scicatUrl;
        this.skipConfirmation = skipConfirmation;
        this.gatherData = gatherData;

        this.dialog = new Dialog();
    }

    createButton() {
        const button = document.createElement("button");
        button.textContent = "Upload dataset";
        button.classList.add("cean-upload-button", "jupyter-button");
        button.addEventListener("click", () => {
            this.askDoUpload();
        });
        return button;
    }

    private askDoUpload() {
        const gathered = this.gatherData();
        if (gathered.validationErrors || !this.skipConfirmation) {
            this.showConfirmationDialog(gathered.data, gathered.validationErrors);
        } else {
            this.showProcessingDialog(gathered.data);
        }
    }

    private startUpload(data: Record<string, any>) {
        this.comm.sendReqUploadDataset(this.key, data);
    }

    private showConfirmationDialog(
        data: Record<string, any>,
        validationErrors: boolean,
    ) {
        this.dialog.header.textContent = "Confirm Upload";

        let content = `<p>Are you sure you want to upload this dataset to
${simpleLink(this.scicatUrl)}?</p>
<p class="cean-warning" style="text-align: center;">This cannot be undone!</p>
    `;
        if (validationErrors) {
            content += `<p class="cean-warning-severe" style="text-align: center;">There are validation errors. The upload may fail.</p>`;
        }
        this.dialog.body.innerHTML = content;

        const cancelButton = textButton(
            "Cancel",
            () => {
                this.dialog.close();
            },
            "Cancel upload",
        );
        cancelButton.classList.add("jupyter-button");

        const uploadButton = textButton(
            "Upload",
            () => {
                this.showProcessingDialog(data);
            },
            "Upload dataset",
        );
        uploadButton.setAttribute("autofocus", "");
        // Override default cean-button
        uploadButton.className = "cean-upload-button jupyter-button";

        this.dialog.footer.replaceChildren(cancelButton, uploadButton);

        this.dialog.showModal();
    }

    private showProcessingDialog(data: Record<string, any>) {
        this.startUpload(data);

        this.dialog.closeOnClickOutside = false;
        this.dialog.header.textContent = "Uploading dataset";
        this.dialog.body.innerHTML =
            '<p style="text-align: center;">Please wait...</p>' +
            '<div style="display: flex; justify-content: center;">' +
            '<span class="cean-spinner"></span>' +
            "</div>";

        const abortButton = textButton(
            "Abort",
            () => {
                // TODO actually abort upload, possible?
                this.dialog.close();
            },
            "Abort upload",
        );
        abortButton.setAttribute("tabindex", "-1");
        abortButton.classList.add("jupyter-button");
        this.dialog.footer.replaceChildren(abortButton);
    }

    private showErrorDialog() {
        this.dialog.closeOnClickOutside = true;
        this.dialog.header.textContent = "Error";

        const closeButton = textButton(
            "Abort",
            () => {
                // TODO actually abort upload, possible?
                this.dialog.close();
            },
            "Abort upload",
        );
        closeButton.setAttribute("autofocus", "");
        closeButton.classList.add("jupyter-button");
        this.dialog.footer.replaceChildren(closeButton);
    }

    private showSuccessDialog() {
        this.dialog.closeOnClickOutside = true;
        this.dialog.header.textContent = "Success";

        const closeButton = textButton(
            "Abort",
            () => {
                // TODO actually abort upload, possible?
                this.dialog.close();
            },
            "Abort upload",
        );
        closeButton.setAttribute("autofocus", "");
        closeButton.classList.add("jupyter-button");
        this.dialog.footer.replaceChildren(closeButton);
    }
}

export type GatherResult = {
    validationErrors: boolean;
    data: Record<string, any>;
};
