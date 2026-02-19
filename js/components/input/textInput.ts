import { InputComponent } from "./inputComponent.ts";

export class TextInput extends InputComponent {
    protected readonly inputElement: HTMLInputElement | HTMLTextAreaElement;

    constructor(rawInputElement: HTMLInputElement) {
        super(rawInputElement);

        this.inputElement = TextInput.makeInputElement(rawInputElement);
        // The trim listener must come before the validation listener,
        // so the validation can detect empty strings after trimming.
        this.inputElement.addEventListener("blur", () => {
            this.inputElement.value = this.inputElement.value.trim();
        });
        this.addValidationListener(this.inputElement);
    }

    get value(): string | null {
        const val = this.inputElement.value.trim();
        if (val === "") return null;
        return val;
    }

    wrapElements(): HTMLDivElement {
        return this.wrapElementsWith(this.inputElement);
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
