import { Validator } from "../validation.ts";

/**
 * Base class for input widgets.
 */
export abstract class InputWidget<T> {
    protected readonly key: string;
    readonly required: boolean;
    // The actual <input> element or a wrapper around it.
    // This element has an ID that can be used by a <label> and emits change events.
    // This element has a `data-valid` attribute once it has been updated for the
    // first time but not initially.
    private readonly inputElement_: HTMLElement;
    // A <div> element holding status / error messages for the input.
    protected readonly statusElement: HTMLDivElement;
    // A <div> holding `inputElement` and `statusElement`.
    private readonly container_: HTMLDivElement;
    private readonly validator: OptionalValidator<T>;

    protected constructor(
        key: string,
        input: HTMLElement,
        required: boolean = false,
        validator?: Validator<T>,
    ) {
        this.key = key;
        this.required = required;

        this.inputElement_ = input;
        this.inputElement_.id = crypto.randomUUID();

        input.addEventListener("input", () => this.rawUpdate());
        [this.container_, this.statusElement] = wrapInputElement(input);

        this.validator = makeValidator<T>(required, validator);
    }

    /**
     * Get the value of the input element if it has any.
     */
    abstract get value(): T | null;

    /**
     * Set the value of the input element.
     * @param v Value to set. If `null`, the input element will be cleared.
     */
    abstract set value(v: T | null);

    /**
     * This input element cast to the given type.
     */
    protected inputElement<E = HTMLInputElement>(): E {
        return this.inputElement_ as E;
    }

    /**
     * The wrapper element containing the input and status elements.
     */
    get container(): HTMLElement {
        return this.container_;
    }

    /**
     * The ID of the input element.
     */
    get id(): string {
        return this.inputElement_.id;
    }

    /**
     * Validate the current value and set the status element accordingly.
     * On success, emit an `UpdateEvent` with this widget's key and current value.
     * Consumers may listen to any ancestor (the event bubbles).
     */
    protected updated(): void {
        if (this.validate()) {
            this.container.dispatchEvent(
                new UpdateEvent(this.key, this.value, { bubbles: true }),
            );
        }
    }

    /** Callback for every input event.
     * Validates the input.
     */
    private rawUpdate(): void {
        this.validate();
    }

    private validate(): boolean {
        const validation = this.validator(this.value);
        if (validation !== null) {
            this.statusElement.textContent = validation;
            this.inputElement_.dataset.valid = "false";
            return false;
        } else {
            this.inputElement_.dataset.valid = "true";
            return true;
        }
    }

    /**
     * Register a listener that reacts to "input-updated" events from another widget.
     */
    listenToWidget<U = unknown>(
        otherKey: string,
        handler: (widget: InputWidget<T>, value: U | null) => void,
        target: Document | HTMLElement = document,
    ): void {
        // Call the provided handler on events:
        const listener = this.inputUpdatedListener(otherKey, handler);
        target.addEventListener("input-updated", listener);
        // Remove the handler when `this` is updated manually:
        target.addEventListener(
            "input-updated",
            this.inputUpdatedListener(this.key, () =>
                target.removeEventListener("input-updated", listener as EventListener),
            ),
        );
    }

    /**
     * Make an event listener that calls the given handler when an `UpdateEvent` with
     * the given key is emitted.
     */
    private inputUpdatedListener<U = unknown>(
        otherKey: string,
        handler: (widget: InputWidget<T>, value: U | null) => void,
    ): EventListener {
        return (e: Event) => {
            const ue = e as UpdateEvent;
            if (ue.key === otherKey) {
                handler(this, ue.value_as<U>());
            }
        };
    }
}

function wrapInputElement(input: HTMLElement): [HTMLDivElement, HTMLDivElement] {
    input.classList.add("cean-input");

    const statusElement = document.createElement("div");
    statusElement.classList.add("cean-input-status");

    const container = document.createElement("div");
    container.classList.add("cean-input-container");
    container.replaceChildren(input, statusElement);

    return [container, statusElement];
}

export class UpdateEvent extends Event {
    readonly #key: string;
    readonly #value: unknown;

    constructor(key: string, value: unknown, options?: EventInit) {
        super("input-updated", options);
        this.#key = key;
        this.#value = value;
    }

    get key(): string {
        return this.#key;
    }

    get value(): unknown {
        return this.#value;
    }

    value_as<T>(): T | null {
        return this.value as T | null;
    }
}

/** Like `Validator`, but can handle `null` values. */
type OptionalValidator<T> = (value: T | null) => string | null;

function makeValidator<T>(
    required: boolean,
    validator?: Validator<T>,
): OptionalValidator<T> {
    const requiredMessage = "Required";

    if (required && validator) {
        return (value: T | null) => {
            return value === null || value === undefined
                ? requiredMessage
                : validator(value);
        };
    } else if (validator) {
        return (value: T | null) => {
            return value === null || value === undefined ? null : validator(value);
        };
    } else if (required) {
        return (value: T | null) =>
            value === null || value === undefined ? requiredMessage : null;
    } else {
        return () => null;
    }
}
