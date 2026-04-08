import type { AnyModel, RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { Instrument, Proposal, Techniques } from "./models.ts";
import { BackendComm } from "./comm.ts";
import {
    ComboboxInput,
    DatetimeInput,
    InputComponent,
    MultiAttachmentInput,
    MultiFileInput,
    MultiTextInput,
    PeopleInput,
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

    const inputs = createInputs(model, comm);
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

    // const initial = model.get("initial") as any;
    // if (initial && initial.hasOwnProperty("owners")) {
    //     datasetWidget.setValue("owners", initial.owners);
    // }
    //
    return () => {
        for (const input of inputs.values()) {
            input.destroy();
        }
    };
}

function createInputs(
    model: AnyModel<WidgetModel>,
    comm: BackendComm,
): Map<string, InputComponent<unknown>> {
    const inputList = [
        new TextInput("datasetName", { required: true }),
        new TextInput("description", { multiline: true }),
        makeProposalInput(model.get("proposals")),
        makeInstrumentInput(model.get("instruments")),
        new TextInput("creationLocation", {}),
        new TextInput("runNumber", {}),
        new DatetimeInput("startTime", {}),
        new DatetimeInput("endTime", {}),
        new TextInput("principalInvestigator", { required: true }),
        new TextInput("contactEmail", { required: true, type: "email" }),
        new PeopleInput("owners", {}),
        makeOwnerGroupInput(model.get("accessGroups")),
        new MultiTextInput("accessGroups", {}),
        new TextInput("license", {}),
        new TechniquesInput("techniques", model.get("techniques")),
        new MultiTextInput("usedSoftware", {}),
        new TextInput("sampleId", {}),
        new TextInput("type", { required: true }),
        new MultiTextInput("keywords", {}),
        new TextInput("relationships", {}),
        new TextInput("scientificMetadata", {}),
        new TextInput("sourceFolder", { required: true }),
        new MultiFileInput("files", comm, {}),
        new MultiAttachmentInput("attachments", comm),
    ];

    const inputs = new Map();
    for (const input of inputList) {
        inputs.set(input.key, input);
    }
    return inputs;
}

function makeProposalInput(proposals: Proposal[]): ComboboxInput | TextInput {
    if (proposals.length == 0) {
        return new TextInput("proposalId", {});
    } else {
        const choices =
            proposals
                .map((proposal) => {
                    return { key: proposal.id, text: proposal.title };
                })
                .sort((a, b) => a.key.localeCompare(b.key)) ?? [];

        return new ComboboxInput("proposalId", choices, {});
    }
}

function makeInstrumentInput(instruments: Instrument[]): ComboboxInput | TextInput {
    if (instruments.length == 0) {
        return new TextInput("instrumentId", {});
    } else {
        const choices = instruments
            .map((instrument) => {
                return {
                    key: instrument.id,
                    text: instrument.uniqueName,
                };
            })
            .sort((a, b) => a.text.localeCompare(b.text));

        const renderChoice = (choice: Choice) => {
            const el = document.createElement("span");
            el.className = "cean-item-text";
            el.textContent = choice.text;
            return el;
        };

        return new ComboboxInput("instrumentId", choices, { renderChoice });
    }
}

function makeOwnerGroupInput(accessGroups: string[]): ComboboxInput | TextInput {
    if (accessGroups.length == 0) {
        return new TextInput("ownerGroup", { required: true });
    } else {
        const choices =
            accessGroups
                .map((group) => {
                    return { key: group, text: group };
                })
                .sort((a, b) => a.key.localeCompare(b.key)) ?? [];

        const renderChoice = (choice: Choice) => {
            const el = document.createElement("span");
            el.className = "cean-item-text";
            el.textContent = choice.text;
            return el;
        };

        return new ComboboxInput("ownerGroup", choices, {
            required: true,
            renderChoice,
        });
    }
}

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

export default { render };
