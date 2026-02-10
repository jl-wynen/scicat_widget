import { InputWidget } from "./inputWidget";
import { removeButton } from "../widgets/button.ts";
import { ComboboxInputWidget, Choice } from "./comboboxInputWidget.ts";
import { StringInputWidget } from "./stringInputWidget.ts";
import { createInputWithLabel } from "../forms.ts";

export type Relationship = {
    relationship: string;
    dataset: string;
};

const RELATIONSHIP_CHOICES: Choice[] = [{ key: "input", text: "input", data: {} }];

export class RelationshipsInputWidget extends InputWidget<Relationship[]> {
    private relationshipWidgets: SingleRelationshipWidget[] = [];
    private readonly wrapElement: HTMLDivElement;

    constructor(key: string) {
        // There is no single input element to provide to the parent.
        // But by wrapping all child widgets into a div, the parent can
        // still listen for events.
        const wrap = document.createElement("div");
        super(key, wrap);
        wrap.classList.remove("cean-input");
        this.wrapElement = wrap;
        // Apply the class to the outside div provided by the parent.
        this.container.classList.add("cean-relationships");

        const heading = document.createElement("div");
        heading.textContent = "Relationships";
        this.wrapElement.prepend(heading);

        this.addRelationshipWidget();
    }

    get value(): Relationship[] | null {
        const relationships: Relationship[] = [];

        for (const widget of this.relationshipWidgets) {
            const rel = widget.value;
            if (rel !== null) {
                relationships.push(rel);
            }
        }

        return relationships.length > 0 ? relationships : null;
    }

    set value(v: Relationship[] | null) {
        this.clearRelationships();
        if (v && v.length > 0) {
            for (const rel of v) {
                const widget = this.addRelationshipWidget();
                widget.value = rel;
            }
        }
        // Always ensure there's at least one empty widget for new input
        this.addRelationshipWidget();
    }

    private clearRelationships() {
        for (const widget of this.relationshipWidgets) {
            widget.remove();
        }
        this.relationshipWidgets = [];
    }

    private addRelationshipWidget(): SingleRelationshipWidget {
        const widget = new SingleRelationshipWidget(
            () => {
                this.onWidgetChange(widget);
            },
            () => {
                this.removeRelationshipWidget(widget);
            },
        );
        this.wrapElement.appendChild(widget.element);
        this.relationshipWidgets.push(widget);
        return widget;
    }

    private onWidgetChange(widget: SingleRelationshipWidget) {
        // If the last widget now has a valid value, add a new empty one
        if (
            widget === this.relationshipWidgets[this.relationshipWidgets.length - 1] &&
            widget.value !== null
        ) {
            this.addRelationshipWidget();
        }
        this.updated();
    }

    private removeRelationshipWidget(widget: SingleRelationshipWidget) {
        const index = this.relationshipWidgets.indexOf(widget);

        // If we are removing the last widget and it's empty, add a new empty widget
        // so that there always is an empty widget at the end.
        const removingLastAndEmpty =
            index === this.relationshipWidgets.length - 1 &&
            this.relationshipWidgets[this.relationshipWidgets.length - 1].value ===
                null;

        if (index !== -1) {
            this.relationshipWidgets.splice(index, 1);
        }
        widget.remove();

        // Ensure there's always at least one empty widget
        if (this.relationshipWidgets.length === 0 || removingLastAndEmpty) {
            this.addRelationshipWidget();
        }
        this.updated();
    }
}

class SingleRelationshipWidget {
    readonly key: string;
    readonly element: HTMLDivElement;
    private readonly relationshipInput: ComboboxInputWidget;
    private readonly datasetInput: StringInputWidget;

    constructor(onChange: () => void, onRemove: () => void) {
        this.key = crypto.randomUUID();
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add(
            "cean-single-relationship-widget",
            "cean-input-grid",
        );

        const [relationshipLabel, relationshipInput] = createInputWithLabel(
            `${this.key}_relationship`,
            ComboboxInputWidget,
            [
                {
                    choices: RELATIONSHIP_CHOICES,
                    renderChoice: (choice: Choice) => {
                        const el = document.createElement("div");
                        el.textContent = choice.text;
                        return el;
                    },
                    allowArbitrary: true,
                    filter: true,
                    required: false,
                },
            ],
            "Relationship",
        );
        this.relationshipInput = relationshipInput as ComboboxInputWidget;
        this.relationshipInput.container.addEventListener("input-updated", () => {
            onChange();
        });
        this.element.appendChild(relationshipLabel);
        this.element.appendChild(relationshipInput.container);

        this.element.appendChild(
            removeButton(() => {
                onRemove();
            }),
        );

        const [datasetLabel, datasetInput] = createInputWithLabel(
            `${this.key}_relationship`,
            StringInputWidget,
            [],
            "Dataset",
        );
        this.datasetInput = datasetInput as StringInputWidget;
        this.datasetInput.container.addEventListener("input-updated", () => {
            onChange();
        });
        this.element.appendChild(datasetLabel);
        this.element.appendChild(datasetInput.container);
    }

    get value(): Relationship | null {
        const relationship = this.relationshipInput.value?.trim();
        const dataset = this.datasetInput.value?.trim();

        if (relationship && dataset) {
            return { relationship, dataset };
        }
        return null;
    }

    set value(v: Relationship | null) {
        if (v) {
            this.relationshipInput.value = v.relationship;
            this.datasetInput.value = v.dataset;
        } else {
            this.relationshipInput.value = null;
            this.datasetInput.value = null;
        }
    }

    remove() {
        this.element.remove();
    }
}
