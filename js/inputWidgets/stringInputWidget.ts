import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class StringInputWidget extends InputWidget<string> {
    element: HTMLInputElement | HTMLTextAreaElement;

    constructor(multiLine: boolean = false) {
        const element = makeStringElement(multiLine);
        super((v: string) => {
            element.value = v;
        });
        element.addEventListener("input", () => this.markModified());
        this.element = element;
    }

    get value(): string | null {
        if (this.element.value === "") return null;
        else return this.element.value;
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
