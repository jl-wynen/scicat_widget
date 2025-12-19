import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { DatasetWidget } from "./datasetWidget.ts";
import { Tabs } from "./tabs.ts";
import { StringInputWidget } from "./inputWidgets/stringInputWidget.ts";

interface WidgetModel {}

function render({ model, el }: RenderProps<WidgetModel>) {
    const datasetWidget = new DatasetWidget();
    const filesWidget = new StringInputWidget();
    const attachmentsWidget = new StringInputWidget();

    const uploadButton = makeUploadButton(
        doUpload.bind(null, model, datasetWidget, filesWidget, attachmentsWidget),
    );

    const tabs = new Tabs(
        [
            { label: "Dataset", element: datasetWidget.element },
            { label: "Files", element: filesWidget.element },
            { label: "Attachments", element: attachmentsWidget.element },
        ],
        [makeSciCatLink("https://scicat.ess.eu/"), uploadButton],
    );

    el.appendChild(tabs.element);
}

function doUpload(
    model: AnyModel<WidgetModel>,
    datasetWidget: DatasetWidget,
    filesWidget: StringInputWidget,
    attachmentsWidget: StringInputWidget,
) {
    model.send({
        type: "upload-dataset",
        data: gatherData(datasetWidget, filesWidget, attachmentsWidget),
    });
}

function gatherData(
    datasetWidget: DatasetWidget,
    filesWidget: StringInputWidget,
    attachmentsWidget: StringInputWidget,
): Record<string, any> {
    return {
        ...datasetWidget.gatherData(),
        files: filesWidget.value,
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
