import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { DatasetWidget } from "./datasetWidget.ts";
import { Tabs } from "./tabs.ts";
import { StringInputWidget } from "./inputWidgets/stringInputWidget.ts";
import { Instrument, Proposal, Techniques } from "./models.ts";
import { FilesWidget } from "./filesWidget.ts";
import { simpleLink } from "./widgets/output.ts";
import { BackendComm } from "./comm.ts";
import { UploadWidget, GatherResult } from "./widgets/upload.ts";

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

    const [tabs, datasetWidget, filesWidget, attachmentsWidget] = createTabs(
        model,
        model.get("scicatUrl"),
        comm,
    );

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
): [Tabs, DatasetWidget, FilesWidget, StringInputWidget] {
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

    const uploader = new UploadWidget(comm, scicatUrl, model.get("skipConfirm"), () => {
        return gatherData(datasetWidget, filesWidget, attachmentsWidget);
    });

    const tabs = new Tabs(
        [
            { label: datasetLabel, element: datasetWidget.element },
            { label: filesLabel, element: filesWidget.element },
            { label: attachmentsLabel, element: attachmentsWidget.container },
        ],
        [makeSciCatLinkDiv(scicatUrl), uploader.createButton()],
        scicatUrl,
    );

    return [tabs, datasetWidget, filesWidget, attachmentsWidget];
}

function gatherData(
    datasetWidget: DatasetWidget,
    filesWidget: FilesWidget,
    attachmentsWidget: StringInputWidget,
): GatherResult {
    const fields = datasetWidget.gatherData();
    const files = filesWidget.gatherData();
    const attachments = {
        validationErrors: false,
        data: { attachments: attachmentsWidget.value },
    };
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
