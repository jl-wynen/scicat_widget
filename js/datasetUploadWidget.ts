import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { DatasetWidget } from "./datasetWidget.ts";
import { Tabs } from "./tabs.ts";
import { Instrument, Proposal, Techniques } from "./models.ts";
import { FilesWidget } from "./filesWidget.ts";
import { simpleLink } from "./widgets/output.ts";
import { BackendComm } from "./comm.ts";
import { GatherResult, UploadWidget } from "./widgets/upload.ts";
import { AttachmentsWidget } from "./attachmentsWidget.ts";

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

    const [tabs, datasetWidget, _filesWidget, _attachmentsWidget] = createTabs(
        model,
        model.get("scicatUrl"),
        comm,
        el,
    );

    const initial = model.get("initial") as any;
    if (initial && initial.hasOwnProperty("owners")) {
        datasetWidget.setValue("owners", initial.owners);
    }

    el.appendChild(tabs.element);
    el.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Enter" && e.shiftKey) {
                // Make sure that shift+enter does not re-run the notebook cell.
                e.stopPropagation();
                e.preventDefault();
            }
        },
        true,
    );
}

function createTabs(
    model: AnyModel<any>,
    scicatUrl: string,
    comm: BackendComm,
    container: HTMLElement,
): [Tabs, DatasetWidget, FilesWidget, AttachmentsWidget] {
    const datasetLabel = document.createElement("span");
    datasetLabel.textContent = "Dataset";

    const [filesLabel, nFiles] = createTabLabelWithCount("Files");
    const [attachmentsLabel, nAttachments] = createTabLabelWithCount("Attachments");

    const datasetWidget = new DatasetWidget(
        model.get("proposals"),
        model.get("instruments"),
        model.get("accessGroups"),
        model.get("techniques"),
    );
    const filesWidget = new FilesWidget(
        comm,
        nFiles,
        model.get("instruments"),
        container,
    );
    const attachmentsWidget = new AttachmentsWidget(comm, nAttachments);

    const uploader = new UploadWidget(comm, scicatUrl, model.get("skipConfirm"), () => {
        return gatherData(datasetWidget, filesWidget, attachmentsWidget);
    });

    const tabs = new Tabs(
        [
            { label: datasetLabel, element: datasetWidget.element },
            { label: filesLabel, element: filesWidget.element },
            { label: attachmentsLabel, element: attachmentsWidget.element },
        ],
        [makeSciCatLinkDiv(scicatUrl), uploader.createButton()],
        scicatUrl,
    );

    return [tabs, datasetWidget, filesWidget, attachmentsWidget];
}

function createTabLabelWithCount(text: string): [HTMLDivElement, HTMLSpanElement] {
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    const countSpan = document.createElement("span");
    countSpan.textContent = "(0)";
    countSpan.style.marginLeft = "0.5em";

    const label = document.createElement("div");
    label.append(textSpan, countSpan);
    return [label, countSpan];
}

function gatherData(
    datasetWidget: DatasetWidget,
    filesWidget: FilesWidget,
    attachmentsWidget: AttachmentsWidget,
): GatherResult {
    const fields = datasetWidget.gatherData();
    const files = filesWidget.gatherData();
    const attachments = attachmentsWidget.gatherData();
    return {
        validationErrors:
            fields.validationErrors ||
            files.validationErrors ||
            attachments.validationErrors,
        data: { ...fields.data, files: files.data, attachments: attachments.data },
    };
}

function makeSciCatLinkDiv(href: string): HTMLDivElement {
    const div = document.createElement("div");
    div.innerHTML = simpleLink(href);
    return div;
}

export default { render };
