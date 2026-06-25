import { InputComponent, UpdateEvent, InputOptions } from "./inputComponent.ts";
import { iconButton, removeButton } from "../button.ts";

export interface Options extends InputOptions<string[]> {
    compressedItems?: boolean;
    addButton?: boolean;
}

export class MultiInput extends InputComponent<string[]> {
    private readonly underlying: InputComponent<string>;
    private readonly selectionContainer: HTMLDivElement;
    private readonly renderItem: (value: string) => HTMLElement;

    constructor(
        key: string,
        underlying: InputComponent<string>,
        renderItem: (value: string) => HTMLElement,
        options: Options,
    ) {
        const [container, selectionContainer] = createElements(
            underlying,
            options,
            (value: string) => {
                this.addItem(value);
            },
        );

        super(key, container, options);
        this.underlying = underlying;
        this.selectionContainer = selectionContainer;
        this.renderItem = renderItem;

        underlying.container.addEventListener("input-updated", ((e: UpdateEvent) => {
            this.addItem(e.value_as<string>());
        }) as EventListener);
    }

    get id(): string {
        return this.underlying.id;
    }

    get value(): string[] | null {
        return Array.from(
            this.selectionContainer.querySelectorAll<HTMLElement>(
                ".cean-selected-item",
            ),
        ).map((item) => {
            return item.dataset.value!;
        });
    }

    setSilent(value: string[] | null) {
        this.selectionContainer.replaceChildren(...(value ?? []).map(this.createItem));
    }

    private addItem(value: string | null) {
        this.underlying.setSilent(null);
        if (value === null) return;
        if (!this.isSelected(value)) {
            this.selectionContainer.append(this.createItem(value));
            this.updated();
        }
    }

    private isSelected(value: string): boolean {
        return (
            this.selectionContainer.querySelector(`[data-value="${value}"]`) !== null
        );
    }

    private removeItem(value: string) {
        this.selectionContainer.querySelector(`[data-value="${value}"]`)?.remove();
        this.updated();
    }

    private createItem(value: string): HTMLDivElement {
        const item = document.createElement("div");
        item.className = "cean-selected-item";
        item.dataset.value = value;
        item.append(
            this.renderItem(value),
            removeButton(() => {
                this.removeItem(value);
            }),
        );
        return item;
    }
}

function createElements(
    underlying: InputComponent<string>,
    options: Options,
    addItem: (value: string) => void,
): [HTMLDivElement, HTMLDivElement] {
    const selectionContainer = document.createElement("div");
    selectionContainer.className = "cean-selected-items";
    if (options.compressedItems) {
        selectionContainer.classList.add("cean-compressed-items");
    }

    const container = document.createElement("div");

    if (options.addButton) {
        function onClick() {
            const value = underlying.value;
            if (value) addItem(value);
        }
        const addButton = iconButton("plus", onClick, "Add item");
        addButton.tabIndex = -1;

        const lineWrap = document.createElement("div");
        lineWrap.className = "cean-input-grid cean-input-and-button";
        lineWrap.append(underlying.container, addButton);
        container.append(lineWrap);
    } else {
        container.append(underlying.container);
    }

    container.append(selectionContainer);
    return [container, selectionContainer];
}
