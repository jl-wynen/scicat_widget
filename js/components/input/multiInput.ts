import { InputComponent, UpdateEvent } from "./inputComponent.ts";
import { removeButton } from "../button.ts";

export class MultiInput extends InputComponent<string[]> {
    private readonly underlying: InputComponent<string>;
    private readonly selectionContainer: HTMLDivElement;
    private readonly renderItem: (value: string) => HTMLElement;

    constructor(
        key: string,
        underlying: InputComponent<string>,
        renderItem: (value: string) => HTMLElement,
    ) {
        const selectionContainer = document.createElement("div");
        const container = document.createElement("div");
        container.append(underlying.container, selectionContainer);

        super(key, container, {});
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
