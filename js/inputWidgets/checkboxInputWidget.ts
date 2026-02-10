import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class CheckboxInputWidget extends InputWidget<boolean> {
    constructor(key: string) {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "checkbox";
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
    }

    get value(): boolean {
        return this.inputElement().checked;
    }

    set value(v: boolean | null) {
        this.inputElement().checked = Boolean(v);
    }
}
