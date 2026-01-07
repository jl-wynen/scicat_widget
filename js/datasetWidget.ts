import {
    CheckboxInputWidget,
    ComboboxInputWidget,
    DatetimeInputWidget,
    DropdownInputWidget,
    InputWidget,
    OwnersInputWidget,
    PrincipalInvestigatorInputWidget,
    StringInputWidget,
} from "./inputWidgets";
import { createInputWithLabel } from "./forms.ts";
import { Instrument } from "./models";
import { Choice } from "./inputWidgets/comboboxInputWidget.ts";

export class DatasetWidget {
    element: HTMLDivElement;
    private readonly inputWidgets: Map<string, InputWidget<any>>;

    // TODO suppress shift+enter, else it re-renders the cell!
    constructor(instruments: [Instrument]) {
        const container = document.createElement("div");
        container.classList.add("cean-ds");

        this.inputWidgets = new Map<string, InputWidget<any>>();
        container.appendChild(createGeneralInfoPanel(this.inputWidgets, instruments));
        container.appendChild(createOwnerPanel(this.inputWidgets));
        container.appendChild(createMiscPanel(this.inputWidgets));
        container.appendChild(createScientificMetadataPanel());

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
    instruments: [Instrument],
): HTMLElement {
    const create = createAndAppend.bind(null, inputWidgets);

    const columns = document.createElement("section");
    columns.classList.add("cean-ds-general-info");

    const nameInput = create(columns, "Name", "name", StringInputWidget);
    nameInput.element.classList.add("cean-span-3");

    const descriptionInput = create(
        columns,
        "Description",
        "description",
        StringInputWidget,
        true,
    );
    descriptionInput.element.classList.add("cean-span-3");

    const proposalInput = createProposalsWidget(inputWidgets, columns);
    proposalInput.element.classList.add("cean-span-3");

    createInstrumentsWidget(inputWidgets, columns, instruments);

    let creationLocation = create(
        columns,
        "Creation location",
        "creation_location",
        StringInputWidget,
    );
    creationLocation.listenToWidget("instrument_id", (widget, instrumentId) => {
        // TODO construct location based on input pattern (python)
        widget.value = `ESS:${instrumentId}`;
    });

    const runRow = document.createElement("div");
    runRow.classList.add("cean-run-row");
    runRow.classList.add("cean-span-3");

    const [runNumberLabel, runNumberInput] = createInputWithLabel(
        "Run number",
        StringInputWidget,
    );
    inputWidgets.set("run_number", runNumberInput);
    runNumberInput.setKey("run_number");
    runRow.appendChild(runNumberInput.element);

    create(runRow, "Start", "start_time", DatetimeInputWidget);
    create(runRow, "End", "end_time", DatetimeInputWidget);

    columns.appendChild(runNumberLabel);
    columns.appendChild(runRow);

    return columns;
}

function createOwnerPanel(inputWidgets: Map<string, InputWidget<any>>): HTMLElement {
    const columns = document.createElement("section");
    columns.classList.add("cean-ds-owner-columns");
    columns.appendChild(createHumanOwnerPanel(inputWidgets));
    columns.appendChild(createTechnicalOwnerPanel(inputWidgets));
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
        "Owners",
        "owners",
        OwnersInputWidget,
    );
    createAndAppend(
        inputWidgets,
        columns,
        "Principal investigator",
        "pi",
        PrincipalInvestigatorInputWidget,
        ownersInput,
    );
    return columns;
}

function createTechnicalOwnerPanel(
    inputWidgets: Map<string, InputWidget<any>>,
): HTMLDivElement {
    const columns = document.createElement("div");
    columns.classList.add("cean-ds-technical-owners");

    const create = createAndAppend.bind(null, inputWidgets, columns);

    create("Owner group", "owner_group", DropdownInputWidget, ["Group 1", "Group 2"]);
    create("Access groups", "access_groups", StringInputWidget);
    create("License", "license", StringInputWidget);
    create("Publish", "is_published", CheckboxInputWidget);

    return columns;
}

function createMiscPanel(inputWidgets: Map<string, InputWidget<any>>): HTMLElement {
    const columns = document.createElement("section");
    columns.classList.add("cean-ds-misc-columns");
    const left = document.createElement("div");
    left.classList.add("cean-ds-misc-left");
    const right = document.createElement("div");
    right.classList.add("cean-ds-misc-right");

    createTechniquesWidget(inputWidgets, left);
    const createLeft = createAndAppend.bind(null, inputWidgets, left);
    createLeft("Software", "used_software", StringInputWidget);
    createLeft("Sample ID", "sample_id", StringInputWidget);
    createLeft("Keywords", "keywords", StringInputWidget);

    const createRight = createAndAppend.bind(null, inputWidgets, right);
    createRight("Type", "type", DropdownInputWidget, ["derived", "raw"]);
    createRight("Relationships", "relationships", StringInputWidget);

    columns.appendChild(left);
    columns.appendChild(right);
    return columns;
}

function createScientificMetadataPanel(): HTMLElement {
    const container = document.createElement("section");
    container.classList.add("cean-ds-scientific-metadata");

    const table = document.createElement("table");
    table.id = crypto.randomUUID();
    table.classList.add("cean-ds-scientific-metadata-table");

    const title = document.createElement("label");
    title.textContent = "Scientific metadata";
    title.setAttribute("for", table.id);

    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const nameLabel = document.createElement("th");
    nameLabel.textContent = "Name";
    headerRow.appendChild(nameLabel);
    const valueLabel = document.createElement("th");
    valueLabel.textContent = "Value";
    headerRow.appendChild(valueLabel);
    const unitRow = document.createElement("th");
    unitRow.textContent = "Unit";
    headerRow.appendChild(unitRow);
    head.appendChild(headerRow);
    table.appendChild(head);

    const body = document.createElement("tbody");

    const row = document.createElement("tr");

    const nameTd = document.createElement("td");
    const fieldName = document.createElement("input");
    fieldName.type = "text";
    fieldName.textContent = "Field 1";
    nameTd.appendChild(fieldName);
    row.appendChild(nameTd);

    const valueTd = document.createElement("td");
    const fieldValue = document.createElement("input");
    fieldValue.type = "text";
    fieldName.textContent = "Lots of value";
    valueTd.appendChild(fieldValue);
    row.appendChild(valueTd);

    const unitTd = document.createElement("td");
    const fieldUnit = document.createElement("input");
    fieldUnit.type = "text";
    unitTd.appendChild(fieldUnit);
    row.appendChild(unitTd);

    body.appendChild(row);

    table.appendChild(body);

    const addItemButton = document.createElement("button");
    addItemButton.classList.add("cean-button");
    addItemButton.textContent = "Add item";
    addItemButton.addEventListener("click", () => {});

    container.appendChild(title);
    container.appendChild(table);
    container.appendChild(addItemButton);
    return container;
}

function createInstrumentsWidget(
    inputWidgets: Map<string, InputWidget<any>>,
    parent: HTMLElement,
    instruments: [Instrument],
) {
    const instrumentChoices = instruments.map((instrument) => {
        return {
            key: instrument.id,
            text: instrument.uniqueName,
            data: {},
        };
    });

    createAndAppend(
        inputWidgets,
        parent,
        "Instrument",
        "instrument_id",
        ComboboxInputWidget,
        instrumentChoices,
        (choice: Choice) => {
            const el = document.createElement("div");
            el.classList.add("cean-instrument-item");
            el.textContent = choice.text;
            return el;
        },
        false,
    );
}

function createProposalsWidget(
    inputWidgets: Map<string, InputWidget<any>>,
    parent: HTMLElement,
): InputWidget<any> {
    const proposalChoices = [
        { key: "p1", text: "Proposal 1", data: { id: "123" } },
        { key: "p2", text: "Second proposal", data: { id: "abc" } },
        { key: "p3", text: "proposal no 3", data: { id: "abc.456" } },
    ];

    return createAndAppend(
        inputWidgets,
        parent,
        "Proposal",
        "proposal_id",
        ComboboxInputWidget,
        proposalChoices,
        (choice: Choice) => {
            const el = document.createElement("div");

            const name = document.createElement("span");
            name.textContent = choice.text;
            el.appendChild(name);

            const id = document.createElement("span");
            id.textContent = choice.data.id;
            id.style.color = "gray";
            el.appendChild(id);

            return el;
        },
        true,
    );
}

function createTechniquesWidget(
    inputWidgets: Map<string, InputWidget<any>>,
    parent: HTMLElement,
): InputWidget<any> {
    const techniqueChoices = [
        { key: "t1", text: "Indirect Spectroscopy", data: {} },
        { key: "t2", text: "Neutron Powder Diffraction", data: {} },
        { key: "t3", text: "SANS", data: {} },
    ];

    return createAndAppend(
        inputWidgets,
        parent,
        "Techniques",
        "techniques",
        ComboboxInputWidget,
        techniqueChoices,
        (choice: Choice) => {
            const el = document.createElement("div");

            const name = document.createElement("span");
            name.textContent = choice.text;
            el.appendChild(name);

            const id = document.createElement("span");
            id.textContent = choice.key;
            id.style.color = "gray";
            el.appendChild(id);

            return el;
        },
        true,
    );
}

function createAndAppend(
    widgetsMap: Map<string, InputWidget<any>>,
    parent: HTMLElement,
    label: string,
    varName: string,
    widgetType: new (...args: any[]) => InputWidget<any>,
    ...args: any[]
): InputWidget<any> {
    const [labelElement, inputWidget] = createInputWithLabel(
        label,
        widgetType,
        ...args,
    );
    parent.appendChild(labelElement);
    parent.appendChild(inputWidget.element);
    widgetsMap.set(varName, inputWidget);
    inputWidget.setKey(varName);
    return inputWidget;
}
