import { InputWidget } from "./inputWidget";
import { removeButton, textButton } from "../widgets/button.ts";
import { createFormElement } from "../forms";

export type ScientificMetadataItem = {
    name: string;
    value: string;
    unit?: string;
};

export class ScientificMetadataInputWidget extends InputWidget<
    ScientificMetadataItem[]
> {
    private readonly tableBody: HTMLTableSectionElement;
    private items: ScientificMetadataItem[] = [];

    constructor(key: string) {
        const wrap = createFormElement("div") as HTMLDivElement;
        wrap.classList.add("cean-scientific-metadata-widget");

        super(key, wrap);
        wrap.classList.remove("cean-input");

        const table = document.createElement("table");
        table.classList.add("cean-scientific-metadata-table");

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
        wrap.appendChild(table);

        wrap.appendChild(
            textButton("Add item", () => {
                this.addNewRow();
            }),
        );

        // Initial row
        this.addNewRow();
    }

    private addNewRow(item?: ScientificMetadataItem) {
        const newItem = item ?? { name: "", value: "", unit: "" };
        this.items.push(newItem);
        this.tableBody.appendChild(this.createRow(newItem, this.items.length - 1));
    }

    private removeItem(index: number) {
        this.items.splice(index, 1);
        if (this.items.length === 0) {
            this.tableBody.replaceChildren();
            this.addNewRow();
        } else {
            this.renderRows();
        }
        this.updated();
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

        const columns: (keyof ScientificMetadataItem)[] = ["name", "value", "unit"];
        columns.forEach((key) => {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = "text";
            input.value = item[key] ?? "";
            input.addEventListener("input", () => {
                item[key] = input.value;
                this.checkAutoAdd(index);
                this.updated();
            });
            td.appendChild(input);
            tr.appendChild(td);
        });

        const actionsTd = document.createElement("td");
        actionsTd.appendChild(
            removeButton(() => {
                this.removeItem(index);
            }),
        );
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

    get value(): ScientificMetadataItem[] | null {
        const result = [];
        for (const item of this.items) {
            const name = item.name.trim();
            const value = item.value.trim();
            if (name !== "" && value !== "") {
                result.push({ name, value, unit: item.unit?.trim() || undefined });
            }
        }
        return result.length > 0 ? result : null;
    }

    set value(v: ScientificMetadataItem[] | null) {
        this.items = v ? v : [];
        this.renderRows();
    }
}
