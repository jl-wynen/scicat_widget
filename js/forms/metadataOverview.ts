import { createLabelFor } from "./util.ts";
import { InputComponent } from "../components/input";

export class MetadataOverview {
    readonly element: HTMLDivElement;

    constructor(inputs: Map<string, InputComponent<unknown>>) {
        this.element = document.createElement("div");
        this.element.append(
            createGeneralInfo(inputs),
            createColumns(inputs),
            createScientificMetadata(inputs),
        );
    }
}

function createGeneralInfo(
    inputs: Map<string, InputComponent<unknown>>,
): HTMLFieldSetElement {
    const generalInfo = document.createElement("fieldset");
    generalInfo.className = "cean-input-grid cean-general-info cean-fields";
    appendInput(generalInfo, inputs, "datasetName");
    appendInput(generalInfo, inputs, "description");
    appendInput(generalInfo, inputs, "proposalIds");
    appendInput(generalInfo, inputs, "instrumentIds");

    const runNumber = inputs.get("runNumber");
    if (runNumber) {
        generalInfo.appendChild(createLabelFor(runNumber));

        // Don't need an extra class name here, but wrap for consistency.
        const runNumberWrap = document.createElement("div");
        runNumberWrap.append(runNumber.container);

        const runInfoRow = document.createElement("div");
        runInfoRow.className = "cean-input-grid cean-run-info-row";
        runInfoRow.append(runNumberWrap);
        appendInput(runInfoRow, inputs, "creationLocation");
        generalInfo.appendChild(runInfoRow);
    } else {
        console.error("Input runNumber not found");
    }

    const startTime = inputs.get("startTime");
    if (startTime) {
        generalInfo.appendChild(createLabelFor(startTime));

        // Don't need an extra class name here, but wrap for consistency.
        const startTimeWrap = document.createElement("div");
        startTimeWrap.append(startTime.container);

        const timesRow = document.createElement("div");
        timesRow.className = "cean-input-grid cean-times-row";
        timesRow.append(startTimeWrap);
        appendInput(timesRow, inputs, "endTime");
        generalInfo.appendChild(timesRow);
    } else {
        console.error("Input startTime not found");
    }
    return generalInfo;
}

function createColumns(inputs: Map<string, InputComponent<unknown>>): HTMLDivElement {
    const humans = document.createElement("fieldset");
    humans.className = "cean-input-grid cean-fields";
    appendInput(humans, inputs, "principalInvestigators");
    appendInput(humans, inputs, "contactEmails");
    appendInput(humans, inputs, "owners");

    const ownership = document.createElement("fieldset");
    ownership.className = "cean-input-grid cean-fields";
    appendInput(ownership, inputs, "ownerGroup");
    appendInput(ownership, inputs, "accessGroups");
    appendInput(ownership, inputs, "license");

    const misc = document.createElement("fieldset");
    misc.className = "cean-input-grid cean-fields";
    appendInput(misc, inputs, "techniques");
    appendInput(misc, inputs, "usedSoftware");
    appendInput(misc, inputs, "sampleId");

    const relations = document.createElement("fieldset");
    relations.className = "cean-input-grid cean-fields";
    appendInput(relations, inputs, "type");
    appendInput(relations, inputs, "keywords");
    appendInput(relations, inputs, "inputDatasets");

    const columns = document.createElement("div");
    columns.className = "cean-form-columns";
    columns.append(humans, ownership, misc, relations);
    return columns;
}

function createScientificMetadata(
    inputs: Map<string, InputComponent<unknown>>,
): HTMLFieldSetElement {
    const container = document.createElement("fieldset");
    container.className = "cean-fields";
    appendInput(container, inputs, "scientificMetadata");
    return container;
}

function appendInput(
    container: HTMLElement,
    inputs: Map<string, InputComponent<unknown>>,
    name: string,
) {
    const input = inputs.get(name);
    if (input === undefined) {
        console.error(`Input ${name} not found`);
        return;
    }

    const label = createLabelFor(input);
    // Wrap the input to add extra classes.
    const wrap = document.createElement("div");
    wrap.append(input.container);

    container.append(label, wrap);
}
