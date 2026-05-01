import { InputComponent } from "./inputComponent.ts";
import { ComboboxInput, Choice, SelectedEvent } from "./comboboxInput.ts";
import { Techniques } from "../../models.ts";
import { removeButton } from "../button.ts";

export class TechniquesInput extends InputComponent<string[]> {
    private readonly combobox: ComboboxInput;
    private readonly selectionContainer: HTMLDivElement;
    private readonly urlPrefix: string;

    constructor(key: string, techniques: Techniques) {
        const choices = techniques.techniques
            .map((technique) => {
                return { key: technique.id, text: technique.name };
            })
            .sort((a, b) => a.key.localeCompare(b.key));

        const [container, combobox, selectionContainer] = createElements(key, choices);
        super(key, container, {});

        this.combobox = combobox;
        this.selectionContainer = selectionContainer;
        this.urlPrefix = techniques.prefix;

        container.addEventListener("selected-option", ((e: SelectedEvent) => {
            this.addItem(e.key);
        }) as EventListener);
    }

    get id(): string {
        return this.combobox.id;
    }

    get value(): string[] | null {
        return Array.from(
            this.selectionContainer.querySelectorAll<HTMLElement>(
                ".cean-techniques-item",
            ),
        ).map((item) => {
            return item.dataset.key!;
        });
    }

    setSilent(value: string[] | null) {
        this.selectionContainer.replaceChildren(...(value ?? []).map(this.createItem));
    }

    private addItem(key: string) {
        this.combobox.setSilent(null);
        if (!this.selectionContainer.querySelector(`[data-key="${key}"]`)) {
            this.selectionContainer.append(this.createItem(key));
            this.updated();
        }
    }

    private removeItem(key: string) {
        this.selectionContainer.querySelector(`[data-key="${key}"]`)?.remove();
        this.updated();
    }

    private createItem(key: string): HTMLDivElement {
        const item = document.createElement("div");
        item.className = "cean-techniques-item";
        item.dataset.key = key;

        const option = this.find(key);
        if (option === null) {
            item.append(renderUnknownItem(key));
        } else {
            item.append(renderSelectedItem(key, option.text, this.urlPrefix));
        }

        item.append(
            removeButton(() => {
                this.removeItem(key);
            }),
        );

        return item;
    }

    private find(key: string): HTMLOptionElement | null {
        for (const option of this.combobox.options) {
            if (option.value === key) {
                return option;
            }
        }
        return null;
    }
}

function createElements(
    key: string,
    choices: Choice[],
): [HTMLDivElement, ComboboxInput, HTMLDivElement] {
    const combobox = new ComboboxInput(key, choices, {});

    const selectionContainer = document.createElement("div");

    const container = document.createElement("div");
    container.append(combobox.container, selectionContainer);

    return [container, combobox, selectionContainer];
}

function renderSelectedItem(key: string, text: string, prefix: string): HTMLDivElement {
    const keyAnchor = document.createElement("a");
    keyAnchor.text = key;
    keyAnchor.href = `${prefix}/${key}`;
    keyAnchor.target = "_blank";
    keyAnchor.tabIndex = -1;
    keyAnchor.classList.add("cean-item-key");

    const textSpan = document.createElement("span");
    textSpan.className = "cean-item-text";
    textSpan.textContent = text;

    const wrap = document.createElement("div");
    wrap.append(keyAnchor, textSpan);
    return wrap;
}

function renderUnknownItem(key: string): HTMLDivElement {
    const textSpan = document.createElement("span");
    textSpan.className = "cean-item-text";
    textSpan.textContent = key;

    const wrap = document.createElement("div");
    wrap.append(textSpan);
    return wrap;
}
