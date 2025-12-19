/**
 * Base class for input widgets.
 */
export abstract class InputWidget<T> {
    private key?: string;

    protected constructor() {}

    setKey(key: string): void {
        this.key = key;
    }

    /**
     * Emit an input-updated event with this widget's key and current value.
     * Consumers may listen on any ancestor (the event bubbles).
     */
    protected emitUpdated(): void {
        const detail = { key: this.key, value: this.value } as {
            key: string | undefined;
            value: T | null;
        };
        // Only emit if this widget has a key assigned
        if (!detail.key) return;
        const evt = new CustomEvent("input-updated", {
            bubbles: true,
            detail,
        });
        this.element.dispatchEvent(evt);
    }

    /**
     * Register a listener that reacts to "input-updated" events from another widget.
     * Returns an unsubscribe function that can be called manually if needed.
     */
    listenToWidget<U = unknown>(
        otherKey: string,
        handler: (widget: InputWidget<T>, value: U | null) => void,
        target: Document | HTMLElement = document,
    ): () => void {
        const listener = (e: Event) => {
            const ce = e as CustomEvent<{ key: string; value: U | null }>;
            if (ce.detail?.key === otherKey) {
                handler(this, ce.detail.value ?? null);
            }
        };
        target.addEventListener("input-updated", listener as EventListener);
        return () =>
            target.removeEventListener("input-updated", listener as EventListener);
    }

    abstract get value(): T | null;
    abstract set value(v: T | null);

    abstract get element(): HTMLElement;
}
