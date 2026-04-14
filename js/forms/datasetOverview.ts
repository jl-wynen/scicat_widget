import { InputComponent } from "../components/input";
import { Tabs, UploadComponent } from "../components";
import { Attachments } from "./attachments.ts";
import { Files } from "./files.ts";
import { MetadataOverview } from "./metadataOverview.ts";
import { Config } from "../config.ts";

export class DatasetOverview {
    private readonly container: HTMLElement;
    private readonly files: Files;
    private readonly attachments: Attachments;

    constructor(
        inputs: Map<string, InputComponent<unknown>>,
        uploader: UploadComponent,
        config: Config,
    ) {
        this.files = new Files(inputs, true);
        this.attachments = new Attachments(inputs);
        const tabs = assembleTabs(
            new MetadataOverview(inputs),
            this.files,
            this.attachments,
            uploader.createButton(),
            config,
        );

        const filesCount = tabs.countElement(1);
        if (filesCount !== null) this.files.setCountIn(filesCount);
        const attachmentsCount = tabs.countElement(2);
        if (attachmentsCount !== null) this.attachments.setCountIn(attachmentsCount);

        this.container = document.createElement("div");
        this.container.classList.add("cean-dataset-overview");
        this.container.appendChild(tabs.element);
    }

    destroy() {
        this.files.destroy();
        this.attachments.destroy();
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
