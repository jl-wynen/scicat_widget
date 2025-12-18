/**
 * Base class for input widgets.
 *
 * Implements modification detection.
 */
export abstract class InputWidget<T> {
    protected modified: boolean = false;
    private readonly setter: (v: T) => void;

    protected constructor(setter: (v: T) => void) {
        this.setter = setter;
    }

    protected markModified(): void {
        this.modified = true;
    }

    setIfUnchanged(value: T): void {
        if (!this.modified) this.setter(value);
    }

    abstract get value(): T | null;

    abstract get element(): HTMLElement;
}
