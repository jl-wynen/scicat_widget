import type { RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import { Instrument, Proposal, StaticData } from "./models.ts";
import { BackendComm } from "./comm.ts";
import {
    ComboboxInput,
    DatetimeInput,
    InputComponent,
    MultiAttachmentInput,
    MultiFileInput,
    MultiTextInput,
    PeopleInput,
    ScientificMetadataInput,
    TechniquesInput,
    TextInput,
} from "./components/input";
import { Choice } from "./components/input/comboboxInput.ts";
import { DatasetOverview } from "./forms";
import { UploadComponent } from "./components";

interface WidgetModel {
    initial: object;
    staticData: StaticData;
    scicatUrl: string;
    skipConfirmation: boolean;
}

async function render({ model, el }: RenderProps<WidgetModel>) {
    const config = {
        scicatUrl: model.get("scicatUrl"),
        skipConfirmation: model.get("skipConfirmation"),
    };
    const staticData = model.get("staticData");

    const comm = new BackendComm(model);

    const inputs = createInputs(staticData, comm);
    connectInputs(inputs, staticData);

    const uploader = new UploadComponent(comm, config, () => {
        return {};
    });

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
        datasetOverview.destroy();
        for (const input of inputs.values()) {
            input.destroy();
        }
    };
}

function createInputs(
    staticData: StaticData,
    comm: BackendComm,
): Map<string, InputComponent<unknown>> {
    const inputList = [
        new TextInput("datasetName", { required: true }),
        new TextInput("description", { multiline: true }),
        makeProposalInput(staticData.proposals),
        makeInstrumentInput(staticData.instruments),
        new TextInput("creationLocation", {}),
        new TextInput("runNumber", {}),
        new DatetimeInput("startTime", {}),
        new DatetimeInput("endTime", {}),
        new TextInput("principalInvestigator", { required: true }),
        new TextInput("contactEmail", { required: true, type: "email" }),
        new PeopleInput("owners", {}),
        makeOwnerGroupInput(staticData.accessGroups),
        new MultiTextInput("accessGroups", {}),
        new TextInput("license", {}),
        new TechniquesInput("techniques", staticData.techniques),
        new MultiTextInput("usedSoftware", {}),
        new TextInput("sampleId", {}),
        new TextInput("type", { required: true }),
        new MultiTextInput("keywords", {}),
        new TextInput("relationships", {}),
        new ScientificMetadataInput("scientificMetadata", {}),
        new TextInput("sourceFolder", { required: true }),
        new MultiFileInput("files", comm, {}),
        new MultiAttachmentInput("attachments", comm, {}),
    ];

    const inputs = new Map();
    for (const input of inputList) {
        inputs.set(input.key, input);
    }
    return inputs;
}

function connectInputs(
    inputs: Map<string, InputComponent<any>>,
    staticData: StaticData,
) {
    connectInputPair(
        inputs,
        "ownerGroup",
        "proposalId",
        (ownerGroup: InputComponent<string>, proposalId: string | null) => {
            const group =
                staticData.accessGroups.find((group) => {
                    return group === proposalId;
                }) ?? null;
            ownerGroup.setSignaling(group, false);
        },
    );

    connectInputPair(
        inputs,
        "instrumentId",
        "proposalId",
        setterFromItemId(staticData.proposals, (proposal: Proposal) => {
            if (proposal.instrumentIds.length == 1) {
                return proposal.instrumentIds[0];
            } else {
                return null;
            }
        }),
    );

    connectInputPair(
        inputs,
        "creationLocation",
        "instrumentId",
        setterFromItemId(staticData.instruments, (instrument: Instrument) => {
            // TODO generalize
            return `ESS:${instrument.name.toUpperCase()}`;
        }),
    );

    connectInputPair(
        inputs,
        "principalInvestigator",
        "proposalId",
        setterFromItemId(staticData.proposals, (proposal: Proposal) => {
            return proposal.piName;
        }),
    );

    connectInputPair(
        inputs,
        "contactEmail",
        "proposalId",
        setterFromItemId(staticData.proposals, (proposal: Proposal) => {
            return proposal.piEmail;
        }),
    );

    connectInputPair(
        inputs,
        "sourceFolder",
        "proposalId",
        setterFromItemId(staticData.proposals, (proposal: Proposal) => {
            const instrumentId = inputs.get("instrumentId")?.value ?? "";
            const instrument = staticData.instruments.find((instr) => {
                return instr.id == instrumentId;
            });
            if (instrument === undefined) {
                return null;
            }
            // TODO generalize
            return `/ess/data/${instrument.name.toLowerCase()}/${proposal.id}/upload`;
        }),
    );
    connectInputPair(
        inputs,
        "sourceFolder",
        "instrumentId",
        setterFromItemId(staticData.instruments, (instrument: Instrument) => {
            const proposalId = inputs.get("proposalId")?.value ?? "";
            const proposal = staticData.proposals.find((instr) => {
                return instr.id == proposalId;
            });
            if (proposal === undefined) {
                return null;
            }
            // TODO generalize
            return `/ess/data/${instrument.name.toLowerCase()}/${proposal.id}/upload`;
        }),
    );
}

function setterFromItemId<T, Item extends { id: string }>(
    collection: Item[],
    makeValue: (item: Item) => T | null,
) {
    return (destination: InputComponent<T>, id: string | null) => {
        const item = collection.find((item) => {
            return item.id == id;
        });
        if (item) {
            destination.setSignaling(makeValue(item), false);
        } else {
            destination.setSignaling(null, false);
        }
    };
}

function connectInputPair<Dst, Src>(
    inputs: Map<string, InputComponent<any>>,
    destination: string,
    source: string,
    listener: (dst: InputComponent<Dst>, value: Src | null) => void,
) {
    const src = inputs.get(source);
    if (src === undefined) return;
    inputs.get(destination)?.listenToInput(src, listener);
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
