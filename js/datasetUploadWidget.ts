import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
// import { DatasetWidget } from "./datasetWidget.ts";
// import { Tabs } from "./tabs.ts";
import { Instrument, Proposal, Techniques } from "./models.ts";
// import { FilesWidget } from "./filesWidget.ts";
// import { simpleLink } from "./widgets/output.ts";
import { BackendComm } from "./comm.ts";
// import { GatherResult, UploadWidget } from "./widgets/upload.ts";
// import { AttachmentsWidget } from "./attachmentsWidget.ts";
import {
    ComboboxInput,
    DatetimeInput,
    InputComponent,
    MultiTextInput,
    TechniquesInput,
    TextInput,
} from "./components/input";
import { Choice } from "./components/input/comboboxInput.ts";
import { DatasetOverview } from "./forms";
import { UploadComponent } from "./components";

interface WidgetModel {
    initial: object;
    instruments: Instrument[];
    proposals: Proposal[];
    accessGroups: string[];
    techniques: Techniques;
    scicatUrl: string;
    skipConfirmation: boolean;
}

async function render({ model, el }: RenderProps<WidgetModel>) {
    const config = {
        scicatUrl: model.get("scicatUrl"),
        skipConfirmation: model.get("skipConfirmation"),
    };

    const comm = new BackendComm(model);

    const uploader = new UploadComponent(comm, config, () => {
        return {};
    });

    const inputs = createInputs(model);
    const datasetOverview = new DatasetOverview(inputs, uploader, config);
    el.appendChild(datasetOverview.element);

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

    // const [tabs, datasetWidget, _filesWidget, _attachmentsWidget] = createTabs(
    //     model,
    //     model.get("scicatUrl"),
    //     comm,
    //     el,
    // );
    //
    // const initial = model.get("initial") as any;
    // if (initial && initial.hasOwnProperty("owners")) {
    //     datasetWidget.setValue("owners", initial.owners);
    // }
    //
    // el.appendChild(tabs.element);
    // el.addEventListener(
    //     "keydown",
    //     (e) => {
    //         if (e.key === "Enter" && e.shiftKey) {
    //             // Make sure that shift+enter does not re-run the notebook cell.
    //             e.stopPropagation();
    //             e.preventDefault();
    //         }
    //     },
    //     true,
    // );
}

function createInputs(
    model: AnyModel<WidgetModel>,
): Map<string, InputComponent<unknown>> {
    const inputList = [
        new TextInput("datasetName", { required: true }),
        new TextInput("description", { multiline: true }),
        new ComboboxInput(
            "proposalId",
            makeProposalChoices(model.get("proposals")),
            {},
        ),
        new TextInput("instrumentId", {}),
        new TextInput("creationLocation", {}),
        new TextInput("runNumber", {}),
        new DatetimeInput("startTime", {}),
        new DatetimeInput("endTime", {}),
        new TextInput("principalInvestigator", { required: true }),
        new TextInput("contactEmail", { required: true, type: "email" }),
        new TextInput("owners", {}),
        new TextInput("ownerGroup", { required: true }),
        new TextInput("accessGroups", {}),
        new TextInput("license", {}),
        new TechniquesInput("techniques", model.get("techniques")),
        new TextInput("usedSoftware", {}),
        new TextInput("sampleId", {}),
        new TextInput("type", { required: true }),
        new MultiTextInput("keywords", {}),
        new TextInput("relationships", {}),
        new TextInput("scientificMetadata", {}),
        new TextInput("sourceFolder", { required: true }),
        new TextInput("files", {}),
        new TextInput("attachments", {}),
    ];

    const inputs = new Map();
    for (const input of inputList) {
        inputs.set(input.key, input);
    }
    return inputs;
}

function makeProposalChoices(proposals: Proposal[]): Choice[] {
    return (
        proposals
            .map((proposal) => {
                return { key: proposal.id, text: proposal.title };
            })
            .sort((a, b) => a.key.localeCompare(b.key)) ?? []
    );
}

//
// function createTabs(
//     model: AnyModel<any>,
//     scicatUrl: string,
//     comm: BackendComm,
//     container: HTMLElement,
// ): [Tabs, DatasetWidget, FilesWidget, AttachmentsWidget] {
//     const datasetLabel = document.createElement("span");
//     datasetLabel.textContent = "Dataset";
//
//     const [filesLabel, nFiles] = createTabLabelWithCount("Files");
//     const [attachmentsLabel, nAttachments] = createTabLabelWithCount("Attachments");
//
//     const datasetWidget = new DatasetWidget(
//         model.get("proposals"),
//         model.get("instruments"),
//         model.get("accessGroups"),
//         model.get("techniques"),
//     );
//     const filesWidget = new FilesWidget(
//         comm,
//         nFiles,
//         model.get("instruments"),
//         container,
//     );
//     const attachmentsWidget = new AttachmentsWidget(comm, nAttachments);
//
//     const uploader = new UploadWidget(comm, scicatUrl, model.get("skipConfirm"), () => {
//         return gatherData(datasetWidget, filesWidget, attachmentsWidget);
//     });
//
//     const tabs = new Tabs(
//         [
//             { label: datasetLabel, element: datasetWidget.element },
//             { label: filesLabel, element: filesWidget.element },
//             { label: attachmentsLabel, element: attachmentsWidget.element },
//         ],
//         [makeSciCatLinkDiv(scicatUrl), uploader.createButton()],
//         scicatUrl,
//     );
//
//     return [tabs, datasetWidget, filesWidget, attachmentsWidget];
// }
//
// function createTabLabelWithCount(text: string): [HTMLDivElement, HTMLSpanElement] {
//     const textSpan = document.createElement("span");
//     textSpan.textContent = text;
//     const countSpan = document.createElement("span");
//     countSpan.textContent = "(0)";
//     countSpan.style.marginLeft = "0.5em";
//
//     const label = document.createElement("div");
//     label.append(textSpan, countSpan);
//     return [label, countSpan];
// }
//
// function gatherData(
//     datasetWidget: DatasetWidget,
//     filesWidget: FilesWidget,
//     attachmentsWidget: AttachmentsWidget,
// ): GatherResult {
//     const fields = datasetWidget.gatherData();
//     const files = filesWidget.gatherData();
//     const attachments = attachmentsWidget.gatherData();
//     return {
//         validationErrors:
//             fields.validationErrors ||
//             files.validationErrors ||
//             attachments.validationErrors,
//         data: { ...fields.data, files: files.data, attachments: attachments.data },
//     };
// }
//
// function makeSciCatLinkDiv(href: string): HTMLDivElement {
//     const div = document.createElement("div");
//     div.innerHTML = simpleLink(href);
//     return div;
// }

export default { render };
