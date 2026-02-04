import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";
import { Validator } from "../validation";

export type Args = {
    multiLine?: boolean;
    required?: boolean;
    validator?: Validator<string>;
};

export class StringInputWidget extends InputWidget<string> {
    constructor(key: string, args: Args = {}) {
        const element = makeStringElement(args.multiLine ?? false);
        super(key, element, args.required, args.validator);

        element.addEventListener("blur", () => this.updated(), true);

        if (element.tagName.toLowerCase() === "input") {
            element.addEventListener("keydown", (e) => {
                if ((e as KeyboardEvent).key === "Enter") {
                    this.updated();
                }
            });
        } else {
            element.addEventListener("keydown", (e) => {
                if ((e as KeyboardEvent).key === "Enter") {
                    // Do not handle the event upstream but use the <textarea>
                    // default to insert a line break.
                    e.stopPropagation();
                }
            });
        }
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

    set placeholder(v: string | null) {
        const el = this.inputElement<HTMLInputElement | HTMLTextAreaElement>();
        el.placeholder = v ?? "";
    }
}

function makeStringElement(multiLine: boolean): HTMLInputElement | HTMLTextAreaElement {
    if (multiLine) {
        return createFormElement("textarea") as HTMLTextAreaElement;
    } else {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "text";
        return element;
    }
}
