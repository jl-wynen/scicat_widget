import { Validator } from "../../validation.ts";

export abstract class InputComponent {
    readonly id: string;
    readonly required: boolean;
    customValidator: Validator<any> | null = null; // TODO generic

    protected readonly wrapClassName: string;
    protected readonly statusElement: HTMLDivElement;

    protected constructor(rawInputElement: HTMLElement) {
        this.id = rawInputElement.id;
        this.required =
            "required" in rawInputElement &&
            (rawInputElement as HTMLInputElement).required;
        this.wrapClassName = rawInputElement.className;

        this.statusElement = document.createElement("div");
        this.statusElement.id = `${this.id}-status`;
        this.statusElement.className = "status";
    }

    abstract get value(): unknown;

    abstract wrapElements(): HTMLDivElement;

    protected wrapElementsWith(mainElement: HTMLElement): HTMLDivElement {
        const wrap = document.createElement("div");
        wrap.className = this.wrapClassName;
        wrap.classList.add("input-wrap");
        wrap.append(mainElement, this.statusElement);
        return wrap;
    }

    protected addValidationListener(element: HTMLInputElement | HTMLTextAreaElement) {
        const listener = () => {
            if (this.customValidator) {
                const message = this.customValidator(this.value);
                if (message) {
                    element.setCustomValidity(message);
                } else {
                    element.setCustomValidity("");
                }
            }

            if (!element.validity.valid) {
                this.statusElement.textContent = element.validationMessage;
            } else {
                this.statusElement.textContent = "";
            }
        };
        element.addEventListener("input", listener);
        element.addEventListener("blur", listener);
    }

    protected static provisionInputElementFrom(
        rawInputElement: HTMLInputElement,
    ): HTMLInputElement {
        const inputElement = document.createElement("input");
        inputElement.id = rawInputElement.id;
        inputElement.type = rawInputElement.type;
        inputElement.required = rawInputElement.required;

        inputElement.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter" || event.code === "NumpadEnter") {
                event.preventDefault();
                event.stopPropagation();
            }
        });

        return inputElement;
    }

    protected static suppressEnter(element: HTMLElement) {
        element.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter" || event.code === "NumpadEnter") {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }
}
