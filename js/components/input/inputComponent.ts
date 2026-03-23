import { Validator } from "../../validation.ts";

/**
 * Base class for input widgets.
 */
export abstract class InputComponent<T> {
    protected readonly key: string;
    protected readonly statusElement: HTMLOutputElement;
    protected readonly wrapElement: HTMLDivElement;

    readonly required: boolean;
    customValidator: Validator<T> | null = null;
    isValid: () => boolean;

    protected constructor(inputElement: HTMLElement & { required?: boolean }) {
        this.key = inputElement.id;
        this.required = inputElement.required ?? false;

        this.statusElement = document.createElement("output");
        this.statusElement.id = `${this.key}-status`;
        this.statusElement.className = "cean-status";

        this.wrapElement = wrapElementsWith(inputElement, this.statusElement);

        this.isValid = () => this.statusElement.validity.valid;
    }

    get inputKey(): string {
        return this.key;
    }

    get container(): HTMLDivElement {
        return this.wrapElement;
    }

    abstract get value(): T | null;

    abstract setSilent(value: T | null): void;

    setSignaling(value: T | null, userTriggered: boolean = true): void {
        this.setSilent(value);
        this.updated(userTriggered);
    }

    /**
     * Validate the current value and set the status element accordingly.
     * On success, emit an `UpdateEvent` with this widget's key and current value.
     * Consumers may listen to any ancestor (the event bubbles).
     */
    updated(userTriggered: boolean = true): void {
        if (this.isValid()) {
            this.container.dispatchEvent(
                new UpdateEvent(this.key, this.value, userTriggered, { bubbles: true }),
            );
        }
    }

    /**
     * Add a listener to the input element that validates the input.
     *
     * The listener sets the custom validity property of the element to provide it
     * to form controls, and it sets the content of the status element for user display.
     *
     * @param element Input element
     */
    protected addValidationListener(element: HTMLInputElement | HTMLTextAreaElement) {
        const listener = () => {
            if (this.customValidator) {
                const value = this.value;
                if (value === null) {
                    element.setCustomValidity("");
                    return;
                }
                const message = this.customValidator(value);
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

    /** Stop propagation and default behavior of Enter keys. */
    protected static suppressEnter(element: HTMLElement) {
        element.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter" || event.code === "NumpadEnter") {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }
}

export class UpdateEvent extends Event {
    readonly key: string;
    readonly value: unknown;
    /**
     * True if the user triggered this event directly by modifying a widget.
     * False if the event was triggered by an automatic update.
     */
    readonly userTriggered: boolean;

    constructor(
        key: string,
        value: unknown,
        userTriggered: boolean,
        options?: EventInit,
    ) {
        super("input-updated", options);
        this.key = key;
        this.value = value;
        this.userTriggered = userTriggered;
    }

    value_as<T>(): T | null {
        return this.value as T | null;
    }
}

function wrapElementsWith(
    inputElement: HTMLElement,
    statusElement: HTMLOutputElement,
): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "cean-input-wrap";
    wrap.append(inputElement, statusElement);
    return wrap;
}
