import { InputComponent, InputOptions } from "./inputComponent.ts";
import { removeButton, textButton } from "../button.ts";

export type ScientificMetadataItem = Map<string, string>;

type Schema = "plain" | "value-unit";

export interface Options extends InputOptions<ScientificMetadataItem[]> {
    schema: Schema;
}

/**
 * Input component for the scientific metadata field.
 */
export class ScientificMetadataInput extends InputComponent<ScientificMetadataItem[]> {
    private readonly tableBody: HTMLTableSectionElement;
    private readonly schema: Schema;

    constructor(key: string, options: Options) {
        const table = createTable(options.schema);
        const container = document.createElement("div");
        container.id = crypto.randomUUID();
        container.classList.add("cean-scientific-metadata");
        container.append(table);

        super(key, container, options);

        this.tableBody = table.createTBody();
        this.schema = options.schema;

        container.appendChild(
            textButton("Add item", () => {
                this.addNewRow();
            }),
        );

        // Initial row
        this.addNewRow();

        addEventListeners(this.tableBody, () => this.updated(true));
    }

    get value(): ScientificMetadataItem[] | null {
        const items = [];
        for (const tr of this.tableBody.rows) {
            const item = readRow(tr, this.schema);
            if (!itemIsEmpty(item)) {
                items.push(item);
            }
        }
        return items || null;
    }

    setSilent(
        value:
            | ScientificMetadataItem[]
            | Record<string, { value: string; unit?: string }>
            | null,
    ) {
        this.tableBody.replaceChildren();
        if (value === null) {
            this.addNewRow();
        } else if (value instanceof Array) {
            // This is data from JavaScript
            for (const item of value) {
                this.addNewRow(item);
            }
        } else {
            // This is data from Python (scientificMetadata is a dict)
            for (const [name, entry] of Object.entries(value)) {
                const { value, unit } = entry as { value: string; unit?: string };
                this.addNewRow({ name, value, unit });
            }
        }
    }

    get id(): string {
        return this.tableBody.id;
    }

    private addNewRow(item?: ScientificMetadataItem) {
        const newItem = item ?? new Map();

        const tr = document.createElement("tr");

        const columns: string[] = columnNames(this.schema);
        columns.forEach((key) => {
            const input = document.createElement("input");
            input.classList.add("cean-input");
            input.type = "text";
            input.value = newItem.get(key) ?? "";
            input.addEventListener("input", () => {
                newItem.set(key, input.value);
                this.autoAddRow(tr);
            });
            const td = document.createElement("td");
            td.appendChild(input);
            tr.appendChild(td);
        });

        const actionsTd = document.createElement("td");
        actionsTd.appendChild(removeButton(() => this.removeRow(tr)));
        tr.appendChild(actionsTd);

        this.tableBody.appendChild(tr);
    }

    private autoAddRow(modified_tr: HTMLTableRowElement) {
        if (modified_tr === this.tableBody.lastElementChild) {
            const lastItem = readRow(modified_tr, this.schema);
            if (!itemIsEmpty(lastItem)) {
                this.addNewRow();
            }
        }
    }

    private removeRow(tr: HTMLTableRowElement) {
        tr.remove();
        if (this.tableBody.rows.length == 0) {
            this.addNewRow();
        }
    }
}

function readRow(tr: HTMLTableRowElement, schema: Schema): ScientificMetadataItem {
    const item = new Map();
    item.set("name", readCellInput(tr.cells[0]));
    if (schema == "plain") {
        item.set("value", readCellInput(tr.cells[1]));
    } else {
        item.set("value", readCellInput(tr.cells[1]));
        item.set("unit", readCellInput(tr.cells[2]) || undefined);
    }
    return item;
}

function readCellInput(cell: HTMLTableCellElement): string {
    return (cell.firstChild as HTMLInputElement).value.trim();
}

function itemIsEmpty(item: ScientificMetadataItem): boolean {
    for (const value of item.values()) {
        if (value) {
            return false;
        }
    }
    return true;
}

function createTable(schema: Schema): HTMLTableElement {
    const table = document.createElement("table");

    const headerRow = document.createElement("tr");
    const columns = columnNames(schema);
    columns.push(""); // button column at the end
    columns.forEach((text) => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    const head = table.createTHead();
    head.appendChild(headerRow);

    return table;
}

function columnNames(schema: Schema): string[] {
    if (schema == "plain") {
        return ["name", "value"];
    } else {
        return ["name", "value", "unit"];
    }
}

function addEventListeners(tableBody: HTMLTableSectionElement, onUpdate: () => void) {
    tableBody.addEventListener("focusout", (event: FocusEvent) => {
        // relatedTarget is the element receiving focus.
        // If it's still inside the table body, the user is just moving between inputs.
        if (
            event.relatedTarget instanceof Node &&
            tableBody.contains(event.relatedTarget)
        ) {
            return;
        }
        onUpdate();
    });

    tableBody.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code == "Enter" || event.key == "NumpadEnter") {
            event.preventDefault();
            const active = document.activeElement;
            if (!(active instanceof HTMLInputElement)) return;

            // Collect all <input> elements in the table body
            const inputs = Array.from(
                tableBody.querySelectorAll<HTMLInputElement>('input[type="text"]'),
            );
            const currentIndex = inputs.indexOf(active);
            if (currentIndex === -1) return;

            const nextIndex = currentIndex + 1;
            if (nextIndex < inputs.length) {
                inputs[nextIndex].focus();
            } else {
                // This should never happen because we always add a new row
                // when editing the last row.
            }
        }
    });
}
