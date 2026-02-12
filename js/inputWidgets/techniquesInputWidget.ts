import { InputWidget, UpdateEvent } from "./inputWidget";
import { Choice, ComboboxInputWidget } from "./comboboxInputWidget";
import { removeButton } from "../widgets/button.ts";
import { Techniques } from "../models.ts";

export class TechniquesInputWidget extends InputWidget<string[]> {
    private readonly itemsContainer: HTMLDivElement;
    private readonly combobox: ComboboxInputWidget;
    private items: string[] = [];
    private readonly idPrefix: string;
    private readonly choices: Choice[];

    constructor(key: string, techniques: Techniques) {
        const wrap = document.createElement("div");
        wrap.classList.add("cean-techniques-widget");

        super(key, wrap);
        wrap.classList.remove("cean-input");

        this.idPrefix = techniques.prefix;
        this.choices = techniques.techniques
            .map((technique) => {
                return { key: technique.id, text: technique.name, data: {} };
            })
            .sort((a, b) => a.key.localeCompare(b.key));

        const choicesKey = `${this.key}_choices`;
        this.combobox = new ComboboxInputWidget(choicesKey, {
            choices: this.choices,
            renderChoice,
            filter: true,
            allowArbitrary: false,
            required: false,
        });
        this.combobox.container.addEventListener("input-updated", (e) => {
            const event = e as UpdateEvent;
            if (event.key === choicesKey && event.value !== null) {
                this.addItem();
            }
        });

        this.itemsContainer = document.createElement("div");
        this.itemsContainer.classList.add("cean-techniques-items");

        wrap.appendChild(this.combobox.container);
        wrap.appendChild(this.itemsContainer);

        this.renderItems();
    }

    private addItem() {
        const selectedKey = this.combobox.value;
        if (selectedKey && !this.items.includes(selectedKey)) {
            this.items.push(selectedKey);
            this.combobox.value = null;
            this.itemsContainer.appendChild(
                this.createItemBox(selectedKey, this.items.length - 1),
            );
            this.updated();
        }
    }

    private removeItem(index: number) {
        this.items.splice(index, 1);
        this.renderItems();
        this.updated();
    }

    private renderItems() {
        this.itemsContainer.replaceChildren(
            ...this.items.map((item, index) => this.createItemBox(item, index)),
        );
    }

    private createItemBox(key: string, index: number): HTMLElement {
        const box = document.createElement("div");
        box.classList.add("cean-techniques-item");

        const choice = this.choices.find((c) => c.key === key) ?? {
            key,
            text: key,
            data: {},
        };
        const label = renderSelected(choice, this.idPrefix);
        label.classList.add("cean-techniques-item-content");
        box.appendChild(label);

        const removeBtn = removeButton(() => {
            this.removeItem(index);
        });
        box.appendChild(removeBtn);

        return box;
    }

    get value(): string[] | null {
        const items = this.items.map((item) => {
            return `${this.idPrefix}/${item}`;
        });
        return items.length > 0 ? items : null;
    }

    set value(v: string[] | null) {
        this.items = v ?? [];
        this.renderItems();
    }
}

function renderChoice(choice: Choice): HTMLDivElement {
    const el = document.createElement("div");

    const id = document.createElement("span");
    id.textContent = choice.key;
    id.classList.add("cean-item-id");
    el.appendChild(id);

    const name = document.createElement("span");
    name.textContent = choice.text;
    el.appendChild(name);

    return el;
}

function renderSelected(choice: Choice, prefix: string): HTMLDivElement {
    const el = document.createElement("div");
    el.classList.add("cean-techniques-selected-item");

    const name = document.createElement("div");
    name.textContent = choice.text;
    el.appendChild(name);

    const idContainer = document.createElement("div");
    const id = document.createElement("a");
    id.text = choice.key;
    id.href = `${prefix}/${choice.key}`;
    id.target = "_blank";
    id.classList.add("cean-item-id");
    idContainer.appendChild(id);
    el.appendChild(idContainer);

    return el;
}
