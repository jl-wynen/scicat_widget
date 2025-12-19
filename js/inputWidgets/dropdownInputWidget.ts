import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DropdownInputWidget extends InputWidget<string> {
    element: HTMLSelectElement;

    constructor(options: Array<string>) {
        super();
        const element = createFormElement("select") as HTMLSelectElement;
        element.addEventListener("blur", () => this.emitUpdated(), true);
        element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") this.emitUpdated();
        });
        options.forEach((option) => {
            const item = document.createElement("option");
            item.value = option;
            item.textContent = option;
            element.appendChild(item);
        });
        this.element = element;
    }

    get value(): string | null {
        if (this.element.value === "") return null;
        else return this.element.value;
    }

    set value(v: string | null) {
        // TODO this should fully override, regardless of prior content
        const val = v ?? "";
        // Only set to known options to avoid inconsistent UI
        const has = Array.from(this.element.options).some((o) => o.value === val);
        if (has) this.element.value = val;
        else this.element.value = "";
    }
}
