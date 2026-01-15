/**
 * Base class for input widgets.
 */
export abstract class InputWidget<T> {
    private readonly key: string;

    protected constructor(key: string) {
        this.key = key;
    }

    /**
     * Emit an `UpdateEvent` with this widget's key and current value.
     * Consumers may listen to any ancestor (the event bubbles).
     */
    protected emitUpdated(): void {
        if (this.key === undefined) {
            return;
        }
        this.element.dispatchEvent(
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

    abstract get value(): T | null;
    abstract set value(v: T | null);

    abstract get element(): HTMLElement;
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
