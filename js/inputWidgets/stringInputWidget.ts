import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class StringInputWidget extends InputWidget<string> {
    element: HTMLInputElement | HTMLTextAreaElement;

    constructor(key: string, multiLine: boolean = false) {
        super(key);
        const element = makeStringElement(multiLine);
        element.addEventListener("blur", () => this.emitUpdated(), true);
        element.addEventListener("keydown", (ev) => {
            const kev = ev as KeyboardEvent;
            if (kev.key === "Enter" && element.tagName.toLowerCase() === "input") {
                this.emitUpdated();
            }
        });
        this.element = element;
    }

    get value(): string | null {
        if (this.element.value === "") return null;
        else return this.element.value;
    }

    set value(v: string | null) {
        this.element.value = v ?? "";
    }
}

function makeStringElement(multiLine: boolean): HTMLInputElement | HTMLTextAreaElement {
    if (multiLine) {
        // TODO enter does not insert new line
        return createFormElement("textarea") as HTMLTextAreaElement;
    } else {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "text";
        return element;
    }
}
