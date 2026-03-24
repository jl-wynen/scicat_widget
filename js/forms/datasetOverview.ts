import { InputComponent } from "../components/input";
import { Tabs, UploadComponent } from "../components";
import { Attachments } from "./attachments.ts";
import { Files } from "./files.ts";
import { MetadataOverview } from "./metadataOverview.ts";
import { Config } from "../config.ts";
import { BackendComm } from "../comm.ts";

export class DatasetOverview {
    private readonly container: HTMLElement;

    constructor(
        inputs: Map<string, InputComponent<unknown>>,
        uploader: UploadComponent,
        comm: BackendComm,
        config: Config,
    ) {
        const tabs = assembleTabs(
            new MetadataOverview(inputs),
            new Files(inputs, comm, true),
            new Attachments(inputs),
            uploader.createButton(),
            config,
        );

        this.container = document.createElement("div");
        this.container.classList.add("cean-dataset-overview");
        this.container.appendChild(tabs.element);
    }

    get element(): HTMLElement {
        return this.container;
    }
}

function assembleTabs(
    metadataOverview: MetadataOverview,
    files: Files,
    attachments: Attachments,
    uploadButton: HTMLButtonElement,
    config: Config,
): Tabs {
    return new Tabs(
        [
            {
                label: "Dataset",
                panel: metadataOverview.element,
            },
            { label: "Files", panel: files.element, showCount: true },
            { label: "Attachments", panel: attachments.element, showCount: true },
        ],
        [uploadButton],
        config,
    );
}
