import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class CheckboxInputWidget extends InputWidget<boolean> {
    element: HTMLInputElement;

    constructor(key: string) {
        super(key);
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "checkbox";
        element.addEventListener("blur", () => this.emitUpdated(), true);
        element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") this.emitUpdated();
        });
        this.element = element;
    }

    get value(): boolean {
        return this.element.checked;
    }

    set value(v: boolean | null) {
        this.element.checked = Boolean(v);
    }
}
