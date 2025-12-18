import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DropdownInputWidget extends InputWidget<string> {
    element: HTMLSelectElement;

    constructor(options: Array<string>) {
        const element = createFormElement("select") as HTMLSelectElement;
        super((v: string) => {
            if (options.find((o) => o === v) !== undefined) element.value = v;
        });
        element.addEventListener("input", () => this.markModified());
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
}
