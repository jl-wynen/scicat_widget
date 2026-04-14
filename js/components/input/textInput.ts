import { InputComponent, InputOptions } from "./inputComponent.ts";

export interface Options extends InputOptions<string> {
    multiline?: boolean;
    type?: "text" | "email";
    placeholder?: string;
}

/**
 * Input component for text.
 *
 * Can be either `<input type="text"/>` or `<textarea/>`.
 */
export class TextInput extends InputComponent<string> {
    protected readonly inputElement: HTMLInputElement | HTMLTextAreaElement;

    constructor(key: string, options: Options) {
        const inputElement = makeInputElement(options);
        inputElement.id = crypto.randomUUID();
        inputElement.name = key;
        inputElement.required = options.required ?? false;
        inputElement.classList.add("cean-input");

        super(key, inputElement, options);
        this.inputElement = inputElement;
        this.inputElement.placeholder = options.placeholder ?? "";

        // The trim listener must come before the validation listener,
        // so the validation can detect empty strings after trimming.
        this.inputElement.addEventListener("blur", () => {
            this.inputElement.value = this.inputElement.value.trim();
        });
        this.triggerUpdatesFrom(this.inputElement);
        this.addValidationListener(this.inputElement);
    }

    get value(): string | null {
        const val = this.inputElement.value.trim();
        if (val === "") return null;
        return val;
    }

    setSilent(value: string | null) {
        this.inputElement.value = value ?? "";
    }

    get placeholder(): string {
        return this.inputElement.placeholder;
    }

    set placeholder(v: string | null) {
        this.inputElement.placeholder = v ?? "";
    }
}

function makeInputElement(options: Options): HTMLInputElement | HTMLTextAreaElement {
    if (options.multiline) {
        const textarea = document.createElement("textarea");
        textarea.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter" || event.code === "NumpadEnter") {
                // Do not propagate to form, use the default to insert a line break.
                event.stopImmediatePropagation();
            }
        });
        return textarea;
    } else {
        const inputElement = document.createElement("input");
        inputElement.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter" || event.code === "NumpadEnter") {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        inputElement.type = options.type ?? "text";
        return inputElement;
    }
}
