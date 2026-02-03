import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { DatasetWidget } from "./datasetWidget.ts";
import { Tabs } from "./tabs.ts";
import { StringInputWidget } from "./inputWidgets/stringInputWidget.ts";
import { Instrument, Proposal, Techniques } from "./models.ts";
import { FilesWidget } from "./filesWidget.ts";
import { textButton } from "./widgets/button.ts";
import { BackendComm } from "./comm.ts";

interface WidgetModel {
    initial: object;
    instruments: Instrument[];
    proposals: Proposal[];
    accessGroups: string[];
    techniques: Techniques;
    scicatUrl: string;
    skipConfirm: boolean;
}

async function render({ model, el }: RenderProps<WidgetModel>) {
    const comm = new BackendComm(model);

    const [tabs, datasetWidget] = createTabs(model, model.get("scicatUrl"), comm);

    const initial = model.get("initial") as any;
    if (initial && initial.hasOwnProperty("owners")) {
        datasetWidget.setValue("owners", initial.owners);
    }

    el.appendChild(tabs.element);
}

function createTabs(
    model: AnyModel<any>,
    scicatUrl: string,
    comm: BackendComm,
): [Tabs, DatasetWidget, FilesWidget] {
    const datasetLabel = document.createElement("span");
    datasetLabel.textContent = "Dataset";

    const filesLabel = document.createElement("div");
    const filesSpan = document.createElement("span");
    filesSpan.textContent = "Files";
    filesLabel.appendChild(filesSpan);
    const nFiles = document.createElement("span");
    nFiles.textContent = "(0)";
    nFiles.style.marginLeft = "0.5em";
    filesLabel.appendChild(nFiles);

    const attachmentsLabel = document.createElement("span");
    attachmentsLabel.textContent = "Attachments";

    const datasetWidget = new DatasetWidget(
        model.get("proposals"),
        model.get("instruments"),
        model.get("accessGroups"),
        model.get("techniques"),
    );
    const filesWidget = new FilesWidget(comm, nFiles);
    const attachmentsWidget = new StringInputWidget("attachments");

    const uploadButton = makeUploadButton(
        doUpload.bind(
            null,
            model,
            comm,
            datasetWidget,
            filesWidget,
            attachmentsWidget,
            scicatUrl,
        ),
    );

    const tabs = new Tabs(
        [
            { label: datasetLabel, element: datasetWidget.element },
            { label: filesLabel, element: filesWidget.element },
            { label: attachmentsLabel, element: attachmentsWidget.container },
        ],
        [makeSciCatLinkDiv(scicatUrl), uploadButton],
        scicatUrl,
    );

    return [tabs, datasetWidget, filesWidget];
}

function doUpload(
    model: AnyModel<any>,
    comm: BackendComm,
    datasetWidget: DatasetWidget,
    filesWidget: FilesWidget,
    attachmentsWidget: StringInputWidget,
    scicatUrl: string,
) {
    function uploadImpl() {
        // TODO key
        comm.sendReqUploadDataset(
            "TODO",
            gatherData(datasetWidget, filesWidget, attachmentsWidget),
        );
    }

    if (model.get("skipConfirm")) {
        uploadImpl();
    } else {
        uploadConfirmDialog(uploadImpl, scicatUrl);
    }
}

function uploadConfirmDialog(uploadImpl: () => void, scicatUrl: string) {
    const dialog = document.createElement("dialog");
    dialog.className = "cean-modal-dialog";

    const content = document.createElement("div");
    content.className = "cean-modal-content";

    const header = document.createElement("div");
    header.className = "cean-modal-header";
    header.textContent = "Confirm Upload";

    const body = document.createElement("div");
    body.className = "cean-modal-body";
    body.innerHTML = `<p>Are you sure you want to upload this dataset to
${makeSciCatLink(scicatUrl)}?</p>
<p class="cean-warning" style="text-align: center;">This cannot be undone!</p>
    `;

    const footer = document.createElement("div");
    footer.className = "cean-modal-footer";

    const cancelButton = textButton(
        "Cancel",
        () => {
            dialog.close();
        },
        "Cancel upload",
    );
    cancelButton.classList.add("jupyter-button");

    const uploadButton = textButton(
        "Upload",
        () => {
            uploadImpl();
            dialog.close();
        },
        "Upload dataset",
    );
    uploadButton.setAttribute("autofocus", "");
    // Override default cean-button
    uploadButton.className = "cean-upload-button jupyter-button";

    footer.appendChild(cancelButton);
    footer.appendChild(uploadButton);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    dialog.appendChild(content);

    // Close on click outside
    dialog.onclick = (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    };

    // Remove from DOM when closed
    dialog.onclose = () => {
        dialog.remove();
    };

    document.body.appendChild(dialog);
    dialog.showModal();
}

function gatherData(
    datasetWidget: DatasetWidget,
    filesWidget: FilesWidget,
    attachmentsWidget: StringInputWidget,
): Record<string, any> {
    return {
        ...datasetWidget.gatherData(),
        files: filesWidget.gatherData(),
        attachments: attachmentsWidget.value,
    };
}

function makeUploadButton(uploadFn: () => void): HTMLButtonElement {
    const uploadButton = document.createElement("button");
    uploadButton.textContent = "Upload dataset";
    uploadButton.classList.add("cean-upload-button");
    uploadButton.classList.add("jupyter-button");
    uploadButton.addEventListener("click", uploadFn);
    return uploadButton;
}

function makeSciCatLink(href: string): string {
    const display = href.replace(/^https?:\/\/|\/$/g, "");
    return `<a href="${href}" target=_blank>${display}</a>`;
}

function makeSciCatLinkDiv(href: string): HTMLDivElement {
    const div = document.createElement("div");
    div.innerHTML = makeSciCatLink(href);
    return div;
}

export default { render };
