import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DropdownInputWidget extends InputWidget<string> {
    element: HTMLSelectElement;

    constructor(key: string, options: Array<string>) {
        super(key);
        const element = createFormElement("select") as HTMLSelectElement;
        element.classList.add("cean-dropdown");
        element.addEventListener("blur", () => this.emitUpdated(), true);
        element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") this.emitUpdated();
        });
        this.element = element;
        this.buildOptions(options);
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

    set options(options: Array<string>) {
        this.element.replaceChildren();
        this.buildOptions(options);
    }

    disable() {
        this.element.setAttribute("disabled", "true");
    }

    enable() {
        this.element.removeAttribute("disabled");
    }

    private buildOptions(options: Array<string>) {
        options.forEach((option) => {
            const item = document.createElement("option");
            item.value = option;
            item.textContent = option;
            this.element.appendChild(item);
        });
    }
}
