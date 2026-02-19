import { InputComponent } from "./inputComponent.ts";

export class TextInput extends InputComponent {
    constructor(rawInputElement: HTMLInputElement) {
        super(TextInput.makeInputElement(rawInputElement), rawInputElement.className);
    }

    get value(): string | null {
        const val = this.inputElement.value.trim();
        if (val === "") return null;
        return val;
    }

    private static makeInputElement(
        rawInputElement: HTMLInputElement,
    ): HTMLInputElement | HTMLTextAreaElement {
        if (rawInputElement.getAttribute("data-multiline") == "true") {
            const textarea = document.createElement("textarea");
            textarea.id = rawInputElement.id;
            textarea.required = rawInputElement.required;
            textarea.className = rawInputElement.className;

            textarea.addEventListener("keydown", (event: KeyboardEvent) => {
                if (event.code === "Enter" || event.code === "NumpadEnter") {
                    // Do not propagate to form, use the default to insert a line break.
                    event.stopPropagation();
                }
            });

            return textarea;
        } else {
            return InputComponent.provisionInputElementFrom(rawInputElement);
        }
    }
}
