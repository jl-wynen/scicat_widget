/**
 * Base class for input widgets.
 */
export abstract class InputWidget<T> {
    protected readonly key: string;
    // The actual <input> element or a wrapper around it.
    // This element has an ID that can be used by a <label> and emits change events.
    private readonly inputElement_: HTMLElement;
    // A <div> element holding status / error messages for the input.
    protected readonly statusElement: HTMLDivElement;
    // A <div> holding `inputElement` and `statusElement`.
    private readonly container_: HTMLDivElement;

    protected constructor(key: string, input: HTMLElement) {
        this.key = key;

        this.inputElement_ = input;
        this.inputElement_.id = crypto.randomUUID();

        [this.container_, this.statusElement] = wrapInputElement(input);
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
     * Emit an `UpdateEvent` with this widget's key and current value.
     * Consumers may listen to any ancestor (the event bubbles).
     */
    protected emitUpdated(): void {
        if (this.key === undefined) {
            return;
        }
        this.container.dispatchEvent(
            new UpdateEvent(this.key, this.value, { bubbles: true }),
        );
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
    const statusElement = document.createElement("div");
    statusElement.classList.add("cean-input-status");
    statusElement.style.display = "none";

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
