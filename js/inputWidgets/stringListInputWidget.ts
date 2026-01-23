import { InputWidget } from "./inputWidget";
import { iconButton } from "../widgets/iconButton";

export class StringListInputWidget extends InputWidget<string[]> {
    private readonly itemsContainer: HTMLDivElement;
    private readonly input: HTMLInputElement;
    private items: string[] = [];

    constructor(key: string) {
        const wrap = document.createElement("div");
        wrap.classList.add("cean-string-list-widget");

        super(key, wrap);
        wrap.classList.remove("cean-input");

        const inputRow = document.createElement("div");
        inputRow.classList.add("cean-string-list-input-row");

        this.input = document.createElement("input");
        this.input.id = crypto.randomUUID();
        this.input.type = "text";
        this.input.classList.add("cean-input");
        this.input.placeholder = "Add new item...";
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.addItem();
            }
        });

        const addButton = iconButton("plus", () => this.addItem());
        addButton.title = "Add item";
        addButton.setAttribute("tabindex", "-1");

        inputRow.appendChild(this.input);
        inputRow.appendChild(addButton);

        this.itemsContainer = document.createElement("div");
        this.itemsContainer.classList.add("cean-string-list-items");

        wrap.appendChild(inputRow);
        wrap.appendChild(this.itemsContainer);

        this.updateItems();
    }

    private addItem() {
        const val = this.input.value.trim();
        if (val) {
            this.items.push(val);
            this.input.value = "";
            this.updateItems();
            this.updated();
        }
    }

    private removeItem(index: number) {
        this.items.splice(index, 1);
        this.updateItems();
        this.updated();
    }

    private updateItems() {
        this.itemsContainer.replaceChildren(
            ...this.items.map((item, index) => this.createItemBox(item, index)),
        );
    }

    private createItemBox(text: string, index: number): HTMLElement {
        const box = document.createElement("div");
        box.classList.add("cean-string-list-item");

        const label = document.createElement("span");
        label.textContent = text;
        box.appendChild(label);

        const removeBtn = iconButton("trash", () => this.removeItem(index));
        removeBtn.title = "Remove item";
        removeBtn.classList.add("cean-remove-item");
        removeBtn.setAttribute("tabindex", "-1");
        box.appendChild(removeBtn);

        return box;
    }

    get value(): string[] | null {
        return this.items.length > 0 ? this.items : null;
    }

    set value(v: string[] | null) {
        this.items = v ?? [];
        this.updateItems();
    }

    get id(): string {
        return this.input.id;
    }
}
