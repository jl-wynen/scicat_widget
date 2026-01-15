import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DropdownInputWidget extends InputWidget<string> {
    container: HTMLSelectElement;

    constructor(key: string, options: Array<string>) {
        super(key);
        const element = createFormElement("select") as HTMLSelectElement;
        element.classList.add("cean-dropdown");
        element.addEventListener("blur", () => this.emitUpdated(), true);
        element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") this.emitUpdated();
        });
        this.container = element;
        this.buildOptions(options);
    }

    get value(): string | null {
        if (this.container.value === "") return null;
        else return this.container.value;
    }

    set value(v: string | null) {
        // TODO this should fully override, regardless of prior content
        const val = v ?? "";
        // Only set to known options to avoid inconsistent UI
        const has = Array.from(this.container.options).some((o) => o.value === val);
        if (has) this.container.value = val;
        else this.container.value = "";
    }

    set options(options: Array<string>) {
        this.container.replaceChildren();
        this.buildOptions(options);
    }

    disable() {
        this.container.setAttribute("disabled", "true");
    }

    enable() {
        this.container.removeAttribute("disabled");
    }

    private buildOptions(options: Array<string>) {
        options.forEach((option) => {
            const item = document.createElement("option");
            item.value = option;
            item.textContent = option;
            this.container.appendChild(item);
        });
    }
}
