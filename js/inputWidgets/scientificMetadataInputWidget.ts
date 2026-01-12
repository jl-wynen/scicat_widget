import { InputWidget } from "./inputWidget";
import { iconButton } from "../widgets/iconButton";
import { createFormElement } from "../forms";

export interface ScientificMetadataItem {
    name: string;
    value: string;
    unit?: string;
}
// TODO check
export class ScientificMetadataInputWidget extends InputWidget<
    Record<string, { value: any; unit?: string }>
> {
    readonly element: HTMLDivElement;
    private readonly tableBody: HTMLTableSectionElement;
    private items: ScientificMetadataItem[] = [];

    constructor() {
        super();
        this.element = createFormElement("div") as HTMLDivElement;
        this.element.classList.add("cean-scientific-metadata-widget");

        const table = document.createElement("table");
        table.classList.add("cean-ds-scientific-metadata-table");

        const head = document.createElement("thead");
        const headerRow = document.createElement("tr");
        ["Name", "Value", "Unit", ""].forEach((text) => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
        });
        head.appendChild(headerRow);
        table.appendChild(head);

        this.tableBody = document.createElement("tbody");
        table.appendChild(this.tableBody);
        this.element.appendChild(table);

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.classList.add("cean-button");
        addButton.textContent = "Add item";
        addButton.addEventListener("click", () => {
            this.addNewRow();
        });
        this.element.appendChild(addButton);

        // Initial row
        this.addNewRow();
    }

    private addNewRow(item?: ScientificMetadataItem) {
        const newItem = item ?? { name: "", value: "", unit: "" };
        this.items.push(newItem);
        this.renderRows();
    }

    private removeItem(index: number) {
        this.items.splice(index, 1);
        if (this.items.length === 0) {
            this.addNewRow();
        } else {
            this.renderRows();
        }
        this.emitUpdated();
    }

    private renderRows() {
        this.tableBody.replaceChildren(
            ...this.items.map((item, index) => this.createRow(item, index)),
        );
    }

    private createRow(
        item: ScientificMetadataItem,
        index: number,
    ): HTMLTableRowElement {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = item.name;
        nameInput.addEventListener("input", () => {
            item.name = nameInput.value;
            this.checkAutoAdd(index);
            this.emitUpdated();
        });
        nameTd.appendChild(nameInput);
        tr.appendChild(nameTd);

        const valueTd = document.createElement("td");
        const valueInput = document.createElement("input");
        valueInput.type = "text";
        valueInput.value = item.value;
        valueInput.addEventListener("input", () => {
            item.value = valueInput.value;
            this.checkAutoAdd(index);
            this.emitUpdated();
        });
        valueTd.appendChild(valueInput);
        tr.appendChild(valueTd);

        const unitTd = document.createElement("td");
        const unitInput = document.createElement("input");
        unitInput.type = "text";
        unitInput.value = item.unit ?? "";
        unitInput.addEventListener("input", () => {
            item.unit = unitInput.value;
            this.checkAutoAdd(index);
            this.emitUpdated();
        });
        unitTd.appendChild(unitInput);
        tr.appendChild(unitTd);

        const actionsTd = document.createElement("td");
        const removeBtn = iconButton("trash", () => this.removeItem(index));
        removeBtn.title = "Remove item";
        removeBtn.classList.add("cean-remove-item");
        removeBtn.setAttribute("tabindex", "-1");
        actionsTd.appendChild(removeBtn);
        tr.appendChild(actionsTd);

        return tr;
    }

    private checkAutoAdd(index: number) {
        if (index === this.items.length - 1) {
            const item = this.items[index];
            if (
                item.name.trim() !== "" ||
                item.value.trim() !== "" ||
                (item.unit && item.unit.trim() !== "")
            ) {
                this.addNewRow();
            }
        }
    }

    get value(): Record<string, { value: any; unit?: string }> | null {
        const result: Record<string, { value: any; unit?: string }> = {};
        let count = 0;
        for (const item of this.items) {
            if (item.name.trim() !== "" && item.value.trim() !== "") {
                result[item.name.trim()] = {
                    value: item.value,
                    unit: item.unit?.trim() || undefined,
                };
                count++;
            }
        }
        return count > 0 ? result : null;
    }

    set value(v: Record<string, { value: any; unit?: string }> | null) {
        this.items = [];
        if (v) {
            for (const [name, data] of Object.entries(v)) {
                this.items.push({
                    name,
                    value: String(data.value),
                    unit: data.unit,
                });
            }
        }
        this.addNewRow();
        this.renderRows();
    }
}
