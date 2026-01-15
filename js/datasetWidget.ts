import {
    CheckboxInputWidget,
    ComboboxInputWidget,
    DatetimeInputWidget,
    InputWidget,
    OwnersInputWidget,
    PrincipalInvestigatorInputWidget,
    ScientificMetadataInputWidget,
    StringInputWidget,
    StringListInputWidget,
    TechniquesInputWidget,
} from "./inputWidgets";
import { createInputWithLabel } from "./forms.ts";
import { Instrument, Proposal, Techniques } from "./models";
import { Choice } from "./inputWidgets/comboboxInputWidget.ts";

export class DatasetWidget {
    element: HTMLDivElement;
    private readonly inputWidgets: Map<string, InputWidget<any>>;

    // TODO suppress shift+enter, else it re-renders the cell!
    constructor(
        proposals: [Proposal],
        instruments: [Instrument],
        accessGroups: [string],
        techniques: Techniques,
    ) {
        const container = document.createElement("div");
        container.classList.add("cean-ds");

        this.inputWidgets = new Map<string, InputWidget<any>>();
        container.appendChild(
            createGeneralInfoPanel(this.inputWidgets, proposals, instruments),
        );
        container.appendChild(createOwnerPanel(this.inputWidgets, accessGroups));
        container.appendChild(createMiscPanel(this.inputWidgets, techniques));
        container.appendChild(createScientificMetadataPanel(this.inputWidgets));

        this.element = container;
    }

    gatherData(): Record<string, any> {
        const data: Record<string, any> = {};
        this.inputWidgets.forEach((widget, key) => {
            const value = widget.value;
            if (value !== null) data[key] = value;
        });
        return data;
    }

    setValue(key: string, value: any) {
        let widget = this.inputWidgets.get(key);
        if (widget !== undefined) widget.value = value;
    }
}

function createGeneralInfoPanel(
    inputWidgets: Map<string, InputWidget<any>>,
    proposals: [Proposal],
    instruments: [Instrument],
): HTMLElement {
    const create = createAndAppend.bind(null, inputWidgets);

    const columns = document.createElement("section");
    columns.classList.add("cean-ds-general-info");

    const nameInput = create(columns, "datasetName", StringInputWidget);
    nameInput.element.classList.add("cean-span-3");

    const descriptionInput = create(columns, "description", StringInputWidget, [true]);
    descriptionInput.element.classList.add("cean-span-3");

    const proposalInput = createProposalsWidget(inputWidgets, columns, proposals);
    proposalInput.element.classList.add("cean-span-3");

    createInstrumentsWidget(inputWidgets, columns, instruments);

    let creationLocation = create(columns, "creationLocation", StringInputWidget);
    creationLocation.listenToWidget("instrumentId", (widget, instrumentId) => {
        // TODO construct location based on input pattern (python)
        widget.value = `ESS:${instrumentId}`;
    });

    const runRow = document.createElement("div");
    runRow.classList.add("cean-run-row");
    runRow.classList.add("cean-span-3");

    const [runNumberLabel, runNumberInput] = createInputWithLabel(
        "runNumber",
        StringInputWidget,
        [],
    );
    inputWidgets.set("runNumber", runNumberInput);
    runRow.appendChild(runNumberInput.element);

    create(runRow, "startTime", DatetimeInputWidget);
    create(runRow, "endTime", DatetimeInputWidget);

    columns.appendChild(runNumberLabel);
    columns.appendChild(runRow);

    return columns;
}

function createOwnerPanel(
    inputWidgets: Map<string, InputWidget<any>>,
    accessGroups: [string],
): HTMLElement {
    const columns = document.createElement("section");
    columns.classList.add("cean-ds-owner-columns");
    columns.appendChild(createHumanOwnerPanel(inputWidgets));
    columns.appendChild(createTechnicalOwnerPanel(inputWidgets, accessGroups));
    return columns;
}

function createHumanOwnerPanel(
    inputWidgets: Map<string, InputWidget<any>>,
): HTMLDivElement {
    const columns = document.createElement("div");
    columns.classList.add("cean-ds-human-owners");
    const ownersInput = createAndAppend(
        inputWidgets,
        columns,
        "owners",
        OwnersInputWidget,
    ) as OwnersInputWidget;
    createAndAppend(
        inputWidgets,
        columns,
        "principalInvestigator",
        PrincipalInvestigatorInputWidget,
        [ownersInput],
    );
    return columns;
}

function createTechnicalOwnerPanel(
    inputWidgets: Map<string, InputWidget<any>>,
    accessGroups: [string],
): HTMLDivElement {
    const columns = document.createElement("div");
    columns.classList.add("cean-ds-technical-owners");

    const create = createAndAppend.bind(null, inputWidgets, columns);

    createOwnerGroupWidget(inputWidgets, columns, accessGroups);
    create("accessGroups", StringInputWidget);
    create("license", StringInputWidget);
    create("isPublished", CheckboxInputWidget);

    return columns;
}

function createMiscPanel(
    inputWidgets: Map<string, InputWidget<any>>,
    techniques: Techniques,
): HTMLElement {
    const columns = document.createElement("section");
    columns.classList.add("cean-ds-misc-columns");
    const left = document.createElement("div");
    left.classList.add("cean-ds-misc-left");
    const right = document.createElement("div");
    right.classList.add("cean-ds-misc-right");

    const createLeft = createAndAppend.bind(null, inputWidgets, left);
    createLeft("techniques", TechniquesInputWidget, [techniques]);
    createLeft("usedSoftware", StringInputWidget);
    createLeft("sampleId", StringInputWidget);

    const createRight = createAndAppend.bind(null, inputWidgets, right);
    createTypeWidget(inputWidgets, right);
    createRight("keywords", StringListInputWidget);
    createRight("relationships", StringInputWidget);

    columns.appendChild(left);
    columns.appendChild(right);
    return columns;
}

function createScientificMetadataPanel(
    inputWidgets: Map<string, InputWidget<any>>,
): HTMLElement {
    const container = document.createElement("section");
    container.classList.add("cean-ds-scientific-metadata");

    createAndAppend(
        inputWidgets,
        container,
        "scientificMetadata",
        ScientificMetadataInputWidget,
    );

    return container;
}

function createInstrumentsWidget(
    inputWidgets: Map<string, InputWidget<any>>,
    parent: HTMLElement,
    instruments: [Instrument],
) {
    const instrumentChoices = instruments
        .map((instrument) => {
            return {
                key: instrument.id,
                text: instrument.uniqueName,
                data: {},
            };
        })
        .sort((a, b) => a.text.localeCompare(b.text));

    createAndAppend(inputWidgets, parent, "instrumentId", ComboboxInputWidget, [
        instrumentChoices,
        (choice: Choice) => {
            const el = document.createElement("div");
            el.textContent = choice.text;
            return el;
        },
        false,
    ]);
}

function createProposalsWidget(
    inputWidgets: Map<string, InputWidget<any>>,
    parent: HTMLElement,
    proposals: [Proposal],
): InputWidget<any> {
    const proposalChoices = proposals
        .map((proposal) => {
            return {
                key: proposal.id,
                text: proposal.title,
                data: {},
            };
        })
        .sort((a, b) => a.text.localeCompare(b.text));

    return createAndAppend(inputWidgets, parent, "proposalId", ComboboxInputWidget, [
        proposalChoices,
        (choice: Choice) => {
            const el = document.createElement("div");

            const id = document.createElement("span");
            id.textContent = choice.key;
            id.classList.add("cean-item-id");
            el.appendChild(id);

            const name = document.createElement("span");
            name.textContent = choice.text;
            el.appendChild(name);

            return el;
        },
        true,
    ]);
}

function createOwnerGroupWidget(
    inputWidgets: Map<string, InputWidget<any>>,
    parent: HTMLElement,
    accessGroups: [string],
): InputWidget<any> {
    const ownerChoices = accessGroups.sort().map((group) => {
        return { key: group, text: group, data: {} };
    });

    return createAndAppend(inputWidgets, parent, "ownerGroup", ComboboxInputWidget, [
        ownerChoices,
        (choice: Choice) => {
            const el = document.createElement("div");
            el.textContent = choice.text;
            return el;
        },
        true,
    ]);
}

function createTypeWidget(
    inputWidgets: Map<string, InputWidget<any>>,
    parent: HTMLElement,
): InputWidget<any> {
    const typeChoices = [
        { key: "derived", text: "derived", data: {} },
        { key: "raw", text: "raw", data: {} },
    ];

    const widget = createAndAppend(inputWidgets, parent, "type", ComboboxInputWidget, [
        typeChoices,
        (choice: Choice) => {
            const el = document.createElement("div");
            el.textContent = choice.text;
            return el;
        },
        true,
        false,
    ]);
    widget.value = "derived";
    return widget;
}

function createAndAppend(
    widgetsMap: Map<string, InputWidget<any>>,
    parent: HTMLElement,
    varName: string,
    widgetType: new (key: string, ...args: any[]) => InputWidget<any>,
    args: unknown[] = [],
): InputWidget<any> {
    const [labelElement, inputWidget] = createInputWithLabel(varName, widgetType, args);
    parent.appendChild(labelElement);
    parent.appendChild(inputWidget.element);
    widgetsMap.set(varName, inputWidget);
    return inputWidget;
}
