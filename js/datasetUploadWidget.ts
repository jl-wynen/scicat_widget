import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { DatasetWidget } from "./datasetWidget.ts";
import { Tabs } from "./tabs.ts";
import { StringInputWidget } from "./inputWidgets/stringInputWidget.ts";
import { Instrument, Proposal, Techniques } from "./models.ts";
import { FilesWidget } from "./filesWidget.ts";

interface WidgetModel {
    initial: object;
    instruments: Instrument[];
    proposals: Proposal[];
    accessGroups: string[];
    techniques: Techniques;
}

function render({ model, el }: RenderProps<WidgetModel>) {
    const [tabs, datasetWidget] = createTabs(model);

    const initial = model.get("initial") as any;
    if (initial && initial.hasOwnProperty("owners")) {
        datasetWidget.setValue("owners", initial.owners);
    }

    el.appendChild(tabs.element);
}

function createTabs(model: AnyModel<any>): [Tabs, DatasetWidget, FilesWidget] {
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
    const filesWidget = new FilesWidget(model, nFiles);
    const attachmentsWidget = new StringInputWidget();

    const uploadButton = makeUploadButton(
        doUpload.bind(null, model, datasetWidget, filesWidget, attachmentsWidget),
    );

    const tabs = new Tabs(
        [
            { label: datasetLabel, element: datasetWidget.element },
            { label: filesLabel, element: filesWidget.element },
            { label: attachmentsLabel, element: attachmentsWidget.element },
        ],
        [makeSciCatLink("https://scicat.ess.eu/"), uploadButton],
    );

    return [tabs, datasetWidget, filesWidget];
}

function doUpload(
    model: AnyModel<WidgetModel>,
    datasetWidget: DatasetWidget,
    filesWidget: FilesWidget,
    attachmentsWidget: StringInputWidget,
) {
    const overlay = document.createElement("div");
    overlay.className = "cean-modal-overlay";

    const content = document.createElement("div");
    content.className = "cean-modal-content";

    const header = document.createElement("div");
    header.className = "cean-modal-header";
    header.textContent = "Confirm Upload";

    const body = document.createElement("div");
    body.className = "cean-modal-body";
    body.textContent = "Are you sure you want to upload this dataset to SciCat?";

    const footer = document.createElement("div");
    footer.className = "cean-modal-footer";

    const cancelButton = document.createElement("button");
    cancelButton.className = "jupyter-button";
    cancelButton.textContent = "Cancel";
    cancelButton.onclick = () => {
        document.body.removeChild(overlay);
    };

    const uploadButton = document.createElement("button");
    uploadButton.className = "cean-upload-button jupyter-button";
    uploadButton.textContent = "Upload";
    uploadButton.onclick = () => {
        model.send({
            type: "cmd:upload-dataset",
            payload: gatherData(datasetWidget, filesWidget, attachmentsWidget),
        });
        document.body.removeChild(overlay);
    };

    footer.appendChild(cancelButton);
    footer.appendChild(uploadButton);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    overlay.appendChild(content);

    document.body.appendChild(overlay);
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

function makeSciCatLink(href: string): HTMLDivElement {
    const wrap = document.createElement("div");
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.textContent = href.replace(/^https?:\/\/|\/$/g, "");
    wrap.appendChild(anchor);
    return wrap;
}

export default { render };
