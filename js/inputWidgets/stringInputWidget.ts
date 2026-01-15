import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class StringInputWidget extends InputWidget<string> {
    container: HTMLInputElement | HTMLTextAreaElement;

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
        this.container = element;
    }

    get value(): string | null {
        if (this.container.value === "") return null;
        else return this.container.value;
    }

    set value(v: string | null) {
        this.container.value = v ?? "";
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
