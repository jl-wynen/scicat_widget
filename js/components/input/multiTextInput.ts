import { InputComponent } from "./inputComponent.ts";
import { iconButton, removeButton } from "../button.ts";

export class MultiTextInput extends InputComponent<string[]> {
    private readonly inputElement: HTMLInputElement;
    private readonly itemsList: HTMLUListElement;
    private readonly addButton: HTMLButtonElement;

    constructor(rawInputElement: HTMLInputElement) {
        super(rawInputElement);

        const [inputElement, itemsContainer, addButton] = createElements(
            rawInputElement.id,
        );
        this.inputElement = inputElement;
        this.itemsList = itemsContainer;
        this.addButton = addButton;
    }

    get value(): string[] | null {
        const values = collectValues(this.itemsList);
        if (values.length === 0) return null;
        return values;
    }

    wrapElements(): HTMLDivElement {
        const inputRow = document.createElement("div");
        inputRow.className = "input-grid input-and-button";
        inputRow.append(this.inputElement, this.addButton);

        const widget = document.createElement("div");
        widget.append(inputRow, this.itemsList);

        return this.wrapElementsWith(widget);
    }
}

function createElements(
    baseId: string,
): [HTMLInputElement, HTMLUListElement, HTMLButtonElement] {
    const inputElement = document.createElement("input");
    inputElement.id = `${baseId}-input`;
    inputElement.type = "text";
    inputElement.placeholder = "Add new item...";

    const itemsList = document.createElement("ul");
    itemsList.id = `${baseId}-items`;
    itemsList.className = "input-items";

    function addItem() {
        const value = inputElement.value.trim();
        if (value === "") return;

        inputElement.value = "";

        const exists = collectValues(itemsList).find((v) => {
            return v == value;
        });
        if (exists !== undefined) return;

        itemsList.append(createItem(value));
    }

    inputElement.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "Enter" || event.code === "NumpadEnter") {
            event.preventDefault();
            event.stopPropagation();
            addItem();
        }
    });

    const addButton = iconButton("plus", addItem, "Add item");

    return [inputElement, itemsList, addButton];
}

function createItem(text: string): HTMLLIElement {
    const item = document.createElement("li");

    const label = document.createElement("span");
    label.className = "input-item-value";
    label.appendChild(document.createTextNode(text));

    const b = removeButton(() => {
        item.remove();
    });

    item.append(label, b);
    return item;
}

function collectValues(itemsList: HTMLUListElement): string[] {
    const values = [];
    for (const el of itemsList.querySelectorAll(".input-item-value")) {
        values.push(el.textContent);
    }
    return values;
}
