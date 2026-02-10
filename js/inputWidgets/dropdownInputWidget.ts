import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DropdownInputWidget extends InputWidget<string> {
    constructor(key: string, options: string[]) {
        const element = createFormElement("select") as HTMLSelectElement;
        element.classList.add("cean-dropdown", "cean-input");
        element.addEventListener(
            "blur",
            () => {
                this.updated();
            },
            true,
        );
        element.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.updated();
        });

        super(key, element);
        this.buildOptions(options);
    }

    get value(): string | null {
        const el = this.inputElement<HTMLSelectElement>();
        if (el.value === "") return null;
        else return el.value;
    }

    set value(v: string | null) {
        // TODO this should fully override, regardless of prior content
        const el = this.inputElement<HTMLSelectElement>();
        const val = v ?? "";
        // Only set to known options to avoid inconsistent UI
        const has = Array.from(el.options).some((o) => o.value === val);
        if (has) el.value = val;
        else el.value = "";
    }

    set options(options: string[]) {
        this.inputElement().replaceChildren();
        this.buildOptions(options);
    }

    disable() {
        this.container.setAttribute("disabled", "true");
    }

    enable() {
        this.container.removeAttribute("disabled");
    }

    private buildOptions(options: string[]) {
        const input = this.inputElement<HTMLSelectElement>();
        options.forEach((option) => {
            const item = document.createElement("option");
            item.value = option;
            item.textContent = option;
            input.appendChild(item);
        });
    }
}
