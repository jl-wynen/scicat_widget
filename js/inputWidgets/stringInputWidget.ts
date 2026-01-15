import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class StringInputWidget extends InputWidget<string> {
    constructor(key: string, multiLine: boolean = false) {
        const element = makeStringElement(multiLine);
        super(key, element);

        element.addEventListener("blur", () => this.emitUpdated(), true);
        element.addEventListener("keydown", (ev) => {
            const kev = ev as KeyboardEvent;
            if (kev.key === "Enter" && element.tagName.toLowerCase() === "input") {
                this.emitUpdated();
            }
        });
    }

    get value(): string | null {
        const el = this.inputElement<HTMLInputElement | HTMLTextAreaElement>();
        if (el.value === "") return null;
        else return el.value;
    }

    set value(v: string | null) {
        const el = this.inputElement<HTMLInputElement | HTMLTextAreaElement>();
        el.value = v ?? "";
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
