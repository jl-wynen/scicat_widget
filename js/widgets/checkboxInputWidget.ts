import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class CheckboxInputWidget extends InputWidget<boolean> {
    element: HTMLInputElement;

    constructor() {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "checkbox";
        super((v: boolean) => {
            element.checked = v;
        });
        element.addEventListener("input", () => this.markModified());
        this.element = element;
    }

    get value(): boolean {
        return this.element.checked;
    }
}
