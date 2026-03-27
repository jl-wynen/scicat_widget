import { InputComponent, InputOptions } from "./inputComponent.ts";
import { iconButton, removeButton } from "../button.ts";

export class MultiTextInput extends InputComponent<string[]> {
    inputElement: HTMLInputElement;
    itemsList: HTMLUListElement;

    constructor(key: string, options: InputOptions<string[]>) {
        const [inputElement, itemsList, addButton] = createElements(key, () => {
            this.updated();
        });
        const inputRow = document.createElement("div");
        inputRow.className = "cean-input-grid cean-input-and-button";
        inputRow.append(inputElement, addButton);

        const wrap = document.createElement("div");
        wrap.append(inputRow, itemsList);

        super(key, wrap, options);
        this.inputElement = inputElement;
        this.itemsList = itemsList;
    }

    // Custom override so this returns the input element's id, not the wrap element's.
    get id(): string {
        return this.inputElement.id;
    }

    get value(): string[] | null {
        const values = collectValues(this.itemsList);
        if (values.length === 0) return null;
        return values;
    }

    setSilent(value: string[] | null) {
        this.itemsList.replaceChildren(...(value ?? []).map(createItem));
    }
}

function createElements(
    key: string,
    onUpdate: () => void,
): [HTMLInputElement, HTMLUListElement, HTMLButtonElement] {
    const inputElement = document.createElement("input");
    inputElement.id = crypto.randomUUID();
    inputElement.name = key;
    inputElement.type = "text";
    inputElement.placeholder = "Add new item...";
    inputElement.className = "cean-input";

    const itemsList = document.createElement("ul");
    itemsList.id = crypto.randomUUID();
    itemsList.className = "cean-input-items";

    function addItem() {
        const value = inputElement.value.trim();
        if (value === "") return;

        inputElement.value = "";

        const exists = collectValues(itemsList).find((v) => {
            return v == value;
        });
        if (exists !== undefined) return;

        itemsList.append(createItem(value, onUpdate));
        onUpdate();
    }

    inputElement.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "Enter" || event.code === "NumpadEnter") {
            event.preventDefault();
            event.stopPropagation();
            addItem();
        }
    });

    const addButton = iconButton("plus", addItem, "Add item");
    addButton.tabIndex = -1;

    return [inputElement, itemsList, addButton];
}

function createItem(text: string, onRemove: () => void): HTMLLIElement {
    const item = document.createElement("li");

    const label = document.createElement("span");
    label.className = "cean-input-item-value";
    label.appendChild(document.createTextNode(text));

    const b = removeButton(() => {
        item.remove();
        onRemove();
    });

    item.append(label, b);
    return item;
}

function collectValues(itemsList: HTMLUListElement): string[] {
    const values = [];
    for (const el of itemsList.querySelectorAll(".cean-input-item-value")) {
        values.push(el.textContent);
    }
    return values;
}
