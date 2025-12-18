import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { DatasetWidget } from "./datasetWidget.ts";

interface WidgetModel {}

function render({ model, el }: RenderProps<WidgetModel>) {
    const datasetWidget = new DatasetWidget();

    const uploadButton = document.createElement("button");
    uploadButton.textContent = "Upload dataset";
    uploadButton.classList.add("cean-upload-button");
    uploadButton.addEventListener("click", () => {
        doUpload(model, datasetWidget);
    });

    el.appendChild(datasetWidget.element);
    el.appendChild(uploadButton);
}

function doUpload(model: AnyModel<WidgetModel>, datasetWidget: DatasetWidget) {
    model.send({ type: "upload-dataset", data: gatherData(datasetWidget) });
}

function gatherData(datasetWidget: DatasetWidget): Record<string, any> {
    return {
        ...datasetWidget.gatherData(),
    };
}

export default { render };
