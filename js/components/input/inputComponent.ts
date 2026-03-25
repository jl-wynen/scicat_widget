import { Validator } from "../../validation.ts";

export interface InputOptions<T> {
    required?: boolean;
    validator?: Validator<T>;
}

/**
 * Base class for input widgets.
 */
export abstract class InputComponent<T> {
    /// A predicatable key for the input, e.g., 'dattasetName'.
    private readonly _key: string;
    /// A unique ID for the input, used as `element.id`.
    private readonly inputId: string;
    private readonly baseInputElement: HTMLElement;
    protected readonly statusElement: HTMLOutputElement;
    protected readonly wrapElement: HTMLDivElement;

    readonly required: boolean;
    customValidator: Validator<T> | null;
    isValid: () => boolean;

    protected constructor(
        key: string,
        inputElement: HTMLElement,
        options: InputOptions<T>,
    ) {
        this._key = key;
        this.inputId = inputElement.id;
        this.required = options.required ?? false;
        this.customValidator = options.validator ?? null;

        this.baseInputElement = inputElement;
        this.statusElement = document.createElement("output");
        this.statusElement.id = `${inputElement.id}-status`;
        this.statusElement.className = "cean-status";

        this.wrapElement = wrapElementsWith(inputElement, this.statusElement);

        this.isValid = () => {
            if (
                inputElement instanceof HTMLInputElement ||
                inputElement instanceof HTMLTextAreaElement
            ) {
                return inputElement.validity.valid;
            }
            return true;
        };
    }

    get key(): string {
        return this._key;
    }

    get id(): string {
        return this.inputId;
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
        // TODO do we need userTriggered?
        if (this.isValid()) {
            this.container.dispatchEvent(
                new UpdateEvent(this.key, this.value, userTriggered, { bubbles: true }),
            );
        }
    }

    validate() {
        const element = this.baseInputElement;
        if (
            !(
                element instanceof HTMLInputElement ||
                element instanceof HTMLTextAreaElement
            )
        ) {
            return; // Element does not support validation
        }

        if (this.customValidator) {
            const value = this.value;
            if (value === null) {
                element.setCustomValidity("");
                return;
            }
            const message = this.customValidator(value);
            element.setCustomValidity(message || "");
        }

        if (!element.validity.valid) {
            this.statusElement.textContent = element.validationMessage;
        } else {
            this.statusElement.textContent = "";
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
            this.validate();
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
