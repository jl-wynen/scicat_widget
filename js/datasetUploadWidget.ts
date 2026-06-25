import type { RenderProps } from "@anywidget/types";
import "./datasetUploadWidget.css";
import {
    Config,
    Instrument,
    Proposal,
    StaticData,
    Technique,
    Techniques,
} from "./models.ts";
import { BackendComm } from "./comm.ts";
import {
    ComboboxInput,
    ComboboxManualInput,
    DatetimeInput,
    InputComponent,
    MultiAttachmentInput,
    MultiFileInput,
    MultiTextInput,
    PeopleInput,
    ScientificMetadataInput,
    MultiInput,
    TextInput,
} from "./components/input";
import { Choice } from "./components/input/comboboxInput.ts";
import { DatasetOverview } from "./forms";
import { createIcon, GatherResult, UploadComponent } from "./components";
import { connectInputs } from "./fieldAutomation.ts";

interface WidgetModel {
    config: Config;
    initial: object;
    staticData: StaticData;
}

async function render({ model, el }: RenderProps<WidgetModel>) {
    const config = model.get("config");
    const staticData = model.get("staticData");

    const comm = new BackendComm(model);

    const inputs = createInputs(config, staticData, comm);
    const inputConnectionCleanup = connectInputs(
        inputs,
        staticData,
        config.fieldDependencies,
        comm,
    );

    const uploader = new UploadComponent(comm, config, () => {
        return gatherData(inputs);
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

    setInitialData(inputs, model.get("initial"));

    return () => {
        datasetOverview.destroy();
        for (const input of inputs.values()) {
            input.destroy();
        }
        inputConnectionCleanup();
    };
}

function createInputs(
    config: Config,
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
        makeTechniquesInput(staticData.techniques),
        new MultiTextInput("usedSoftware", {}),
        new TextInput("sampleId", {}),
        new TextInput("type", { required: true }),
        new MultiTextInput("keywords", {}),
        new MultiTextInput("relationships", {}),
        new ScientificMetadataInput("scientificMetadata", {
            schema: config.scientificMetadataSchema,
        }),
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

function makeProposalInput(proposals: Proposal[]): ComboboxManualInput {
    const choices =
        proposals
            .map((proposal) => {
                return { key: proposal.id, text: proposal.title };
            })
            .sort((a, b) => a.key.localeCompare(b.key)) ?? [];

    return new ComboboxManualInput("proposalId", choices, { fieldName: "proposal ID" });
}

function makeInstrumentInput(instruments: Instrument[]): ComboboxManualInput {
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

    return new ComboboxManualInput("instrumentId", choices, {
        fieldName: "instrument ID",
        renderChoice,
    });
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

function makeTechniquesInput(techniques: Techniques): MultiInput {
    const choices = techniques.techniques
        .map((technique) => {
            return { key: technique.id, text: technique.name };
        })
        .sort((a, b) => a.key.localeCompare(b.key));
    const combobox = new ComboboxManualInput("techniques-choices", choices, {
        fieldName: "technique",
    });

    const renderItem = (value: string): HTMLElement => {
        for (const technique of techniques.techniques) {
            if (technique.id == value) {
                return renderKnownTechniqueItem(technique, techniques.prefix);
            }
        }
        return renderUnknownTechniqueItem(value);
    };

    return new MultiInput("techniques", combobox, renderItem);
}

function renderKnownTechniqueItem(
    technique: Technique,
    urlPrefix: string,
): HTMLElement {
    const keySpan = document.createElement("span");
    keySpan.className = "cean-item-key";
    keySpan.textContent = technique.id;

    const textSpan = document.createElement("span");
    textSpan.className = "cean-item-text";
    textSpan.textContent = technique.name;

    const anchor = document.createElement("a");
    anchor.className = "cean-external-link";
    anchor.href = `${urlPrefix}/${technique.id}`;
    anchor.target = "_blank";
    anchor.tabIndex = -1;
    anchor.append(createIcon("external-link-alt"));

    const wrap = document.createElement("div");
    wrap.append(keySpan, textSpan, anchor);
    return wrap;
}

function renderUnknownTechniqueItem(value: string): HTMLElement {
    const textSpan = document.createElement("span");
    textSpan.className = "cean-item-text        ";
    textSpan.textContent = value;

    const wrap = document.createElement("div");
    wrap.append(textSpan);
    return wrap;
}

function setInitialData(
    inputs: Map<string, InputComponent<any>>,
    initialData: Record<string, any>,
) {
    for (const [key, value] of Object.entries(initialData)) {
        inputs.get(key)?.setSignaling(value, false);
    }
}

function gatherData(inputs: Map<string, InputComponent<any>>): GatherResult {
    const data: Record<string, any> = {};
    let validationErrors = false; // TODO
    for (const [key, input] of inputs.entries()) {
        const value = input.value;
        if (value !== null) data[key] = value;
    }
    return { data, validationErrors };
}

export default { render };
