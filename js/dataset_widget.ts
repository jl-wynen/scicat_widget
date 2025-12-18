import type { RenderProps } from "@anywidget/types";
import "./dataset_widget.css";
import {
    CheckboxInputWidget,
    DatetimeInputWidget,
    DropdownInputWidget,
    InputWidget,
    OwnersInputWidget,
    StringInputWidget
} from "./widgets";
import { createInputWithLabel, createLabelFor } from "./forms.ts";

interface WidgetModel {}

// TODO suppress shift+enter, else it re-renders the cell!
function render({ model, el }: RenderProps<WidgetModel>) {
    const container = document.createElement("div");
    container.classList.add("cean-ds");

    const inputWidgets = new Map<string, InputWidget<any>>();

    container.appendChild(createGeneralInfoPanel(inputWidgets));
    container.appendChild(createOwnerPanel(inputWidgets));
    container.appendChild(createMiscPanel(inputWidgets));
    container.appendChild(createScientificMetadataPanel(inputWidgets));

    model.on("msg:custom", (msg) => {
        console.log(`new message: ${JSON.stringify(msg)}`);
        const data: Record<string, any> = {};
        inputWidgets.forEach((widget, key) => {
            data[key] = widget.value;
        });
        model.send({ type: "my-reply", data: data });
    });
    el.appendChild(container);
}

function createGeneralInfoPanel(
    inputWidgets: Map<string, InputWidget<any>>,
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

    const proposalInput = create(
        columns,
        "Proposal",
        "proposal_id",
        DropdownInputWidget,
        ["Proposal 1", "Proposal 2"],
    );
    proposalInput.element.classList.add("cean-span-3");

    create(columns, "Instrument", "instrument_id", DropdownInputWidget, [
        "DREAM",
        "ODIN",
        "LoKI",
    ]);
    create(columns, "Creation location", "creation_location", StringInputWidget);

    const runRow = document.createElement("div");
    runRow.classList.add("cean-run-row");
    runRow.classList.add("cean-span-3");

    const [runNumberLabel, runNumberInput] = createInputWithLabel(
        "Run number",
        StringInputWidget,
    );
    inputWidgets.set("run_number", runNumberInput);
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
    // createAndAppend(inputWidgets, columns, "Principal investigator", "pi", PrincipalInvestigatorInputWidget, ownersInput);
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
    left.classList.add("cean-ds-misc-right");

    const createLeft = createAndAppend.bind(null, inputWidgets, left);
    createLeft("Sample ID", "sample_id", StringInputWidget);
    createLeft("Software", "used_software", StringInputWidget);
    createLeft("Techniques", "techniques", DropdownInputWidget, [
        "Technique 1",
        "Technique 2",
    ]);
    createLeft("Keywords", "keywords", StringInputWidget);

    const relationshipsInput = document.createElement("input");
    relationshipsInput.type = "text";
    relationshipsInput.id = crypto.randomUUID();
    const relationshipsLabel = createLabelFor(relationshipsInput, "Relationships:");
    right.appendChild(relationshipsLabel);
    right.appendChild(relationshipsInput);

    columns.appendChild(left);
    columns.appendChild(right);
    return columns;
}

function createScientificMetadataPanel(
    inputWidgets: Map<string, InputWidget<any>>,
): HTMLElement {
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
    addItemButton.textContent = "Add item";
    addItemButton.addEventListener("click", () => {});

    container.appendChild(title);
    container.appendChild(table);
    container.appendChild(addItemButton);
    return container;
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
    return inputWidget;
}

export default { render };
