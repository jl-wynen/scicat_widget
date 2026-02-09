import {
    CheckboxInputWidget,
    ComboboxInputWidget,
    DatetimeInputWidget,
    InputWidget,
    OwnersInputWidget,
    RelationshipsInputWidget,
    ScientificMetadataInputWidget,
    StringInputWidget,
    StringListInputWidget,
    TechniquesInputWidget,
} from "./inputWidgets";
import { createInputWithLabel } from "./forms.ts";
import { Instrument, Proposal, Techniques } from "./models";
import { Choice } from "./inputWidgets/comboboxInputWidget.ts";
import { GatherResult } from "./widgets/upload.ts";
import { validateEmail } from "./validation.ts";

export class DatasetWidget {
    element: HTMLDivElement;
    private readonly inputWidgets: Map<string, InputWidget<any>>;

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
            createGeneralInfoPanel(
                this.inputWidgets,
                proposals,
                instruments,
                container,
            ),
        );
        container.appendChild(
            createOwnerPanel(this.inputWidgets, accessGroups, proposals, container),
        );
        container.appendChild(createMiscPanel(this.inputWidgets, techniques));
        container.appendChild(createScientificMetadataPanel(this.inputWidgets));

        this.element = container;
    }

    gatherData(): GatherResult {
        const data: Record<string, any> = {};
        this.inputWidgets.forEach((widget, key) => {
            const value = widget.value;
            if (value !== null) data[key] = value;
        });
        // TODO validation
        return { validationErrors: false, data };
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
    container: HTMLElement,
): HTMLElement {
    const create = createAndAppend.bind(null, inputWidgets);

    const columns = document.createElement("section");
    columns.classList.add("cean-ds-general-info", "cean-input-panel");

    const nameInput = create(columns, "datasetName", StringInputWidget, [
        { required: true },
    ]);
    nameInput.container.classList.add("cean-span-3");

    const descriptionInput = create(columns, "description", StringInputWidget, [
        { multiLine: true },
    ]);
    descriptionInput.container.classList.add("cean-span-3");

    const proposalInput = createProposalsWidget(inputWidgets, columns, proposals);
    proposalInput.container.classList.add("cean-span-3");

    createInstrumentsWidget(inputWidgets, columns, instruments, proposals);

    let creationLocation = create(columns, "creationLocation", StringInputWidget, [
        { required: true },
    ]);
    creationLocation.listenToWidget(
        "instrumentId",
        makeSetterForIdMatch(instruments, (instrument) => {
            return `ESS:${instrument.name}`;
        }),
        container,
    );

    const runRow = document.createElement("div");
    runRow.classList.add("cean-run-row");
    runRow.classList.add("cean-span-3");

    const [runNumberLabel, runNumberInput] = createInputWithLabel(
        "runNumber",
        StringInputWidget,
        [],
    );
    inputWidgets.set("runNumber", runNumberInput);
    runRow.appendChild(runNumberInput.container);

    create(runRow, "startTime", DatetimeInputWidget);
    create(runRow, "endTime", DatetimeInputWidget);

    columns.appendChild(runNumberLabel);
    columns.appendChild(runRow);

    return columns;
}

function createOwnerPanel(
    inputWidgets: Map<string, InputWidget<any>>,
    accessGroups: [string],
    proposals: [Proposal],
    container: HTMLElement,
): HTMLElement {
    const columns = document.createElement("section");
    columns.classList.add("cean-ds-owner-columns");
    columns.appendChild(createHumanOwnerPanel(inputWidgets, proposals, container));
    columns.appendChild(createTechnicalOwnerPanel(inputWidgets, accessGroups));
    return columns;
}

function createHumanOwnerPanel(
    inputWidgets: Map<string, InputWidget<any>>,
    proposals: [Proposal],
    container: HTMLElement,
): HTMLDivElement {
    const columns = document.createElement("div");
    columns.classList.add("cean-ds-human-owners", "cean-input-panel");

    const pi = createAndAppend(
        inputWidgets,
        columns,
        "principalInvestigator",
        StringInputWidget,
        [{ required: true }],
    );
    pi.listenToWidget(
        "proposalId",
        makeSetterForIdMatch(proposals, (proposal) => {
            return proposal.piName;
        }),
        container,
    );
    const contactEmail = createAndAppend(
        inputWidgets,
        columns,
        "contactEmail",
        StringInputWidget,
        [{ required: true, validator: validateEmail }],
    );
    contactEmail.listenToWidget(
        "proposalId",
        makeSetterForIdMatch(proposals, (proposal) => {
            return proposal.piEmail;
        }),
        container,
    );

    createAndAppend(inputWidgets, columns, "owners", OwnersInputWidget);

    return columns;
}

function createTechnicalOwnerPanel(
    inputWidgets: Map<string, InputWidget<any>>,
    accessGroups: [string],
): HTMLDivElement {
    const columns = document.createElement("div");
    columns.classList.add("cean-ds-technical-owners", "cean-input-panel");

    const create = createAndAppend.bind(null, inputWidgets, columns);

    createOwnerGroupWidget(inputWidgets, columns, accessGroups);
    create("accessGroups", StringListInputWidget);
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
    left.classList.add("cean-ds-misc-left", "cean-input-panel");
    const right = document.createElement("div");
    right.classList.add("cean-ds-misc-right", "cean-input-panel");

    const createLeft = createAndAppend.bind(null, inputWidgets, left);
    createLeft("techniques", TechniquesInputWidget, [techniques]);
    createLeft("usedSoftware", StringListInputWidget);
    createLeft("sampleId", StringInputWidget);

    const createRight = createAndAppend.bind(null, inputWidgets, right);
    createTypeWidget(inputWidgets, right);
    createRight("keywords", StringListInputWidget);

    const relationshipWidget = new RelationshipsInputWidget("relationships");
    inputWidgets.set("relationships", relationshipWidget);
    right.appendChild(relationshipWidget.container);

    columns.appendChild(left);
    columns.appendChild(right);
    return columns;
}

function createScientificMetadataPanel(
    inputWidgets: Map<string, InputWidget<any>>,
): HTMLElement {
    const container = document.createElement("section");
    container.classList.add("cean-ds-scientific-metadata", "cean-input-panel");

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
    proposals: [Proposal],
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

    const instrumentWidget = createAndAppend(
        inputWidgets,
        parent,
        "instrumentId",
        ComboboxInputWidget,
        [
            {
                choices: instrumentChoices,
                renderChoice: (choice: Choice) => {
                    const el = document.createElement("div");
                    el.textContent = choice.text;
                    return el;
                },
                allowArbitrary: false,
            },
        ],
    );

    instrumentWidget.listenToWidget(
        "proposalId",
        (widget, proposalId) => {
            const proposal = proposals.find((p) => {
                return p.id == proposalId;
            });
            if (proposal) {
                if (proposal.instrumentIds.length == 1) {
                    widget.value = proposal.instrumentIds[0];
                } else {
                    widget.value = "";
                }
            } else {
                widget.value = "";
            }
        },
        // Listen to `parent` because the proposal and instrument are in the same div
        parent,
    );
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
        {
            choices: proposalChoices,
            renderChoice: (choice: Choice) => {
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
        },
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
        {
            choices: ownerChoices,
            renderChoice: (choice: Choice) => {
                const el = document.createElement("div");
                el.textContent = choice.text;
                return el;
            },
            required: true,
        },
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
        {
            choices: typeChoices,
            renderChoice: (choice: Choice) => {
                const el = document.createElement("div");
                el.textContent = choice.text;
                return el;
            },
            filter: false,
        },
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
    parent.appendChild(inputWidget.container);
    widgetsMap.set(varName, inputWidget);
    return inputWidget;
}

function makeSetterForIdMatch(
    items: { id: string }[],
    makeValue: (item: any) => string,
) {
    return (widget: InputWidget<string>, selectedId: string | null) => {
        const item = items.find((item) => {
            return item.id == selectedId;
        });
        if (item) {
            widget.value = makeValue(item);
        } else {
            widget.value = "";
        }
    };
}
