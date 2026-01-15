import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class CheckboxInputWidget extends InputWidget<boolean> {
    container: HTMLInputElement;

    constructor(key: string) {
        super(key);
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "checkbox";
        element.addEventListener("blur", () => this.emitUpdated(), true);
        element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") this.emitUpdated();
        });
        this.container = element;
    }

    get value(): boolean {
        return this.container.checked;
    }

    set value(v: boolean | null) {
        this.container.checked = Boolean(v);
    }
}
