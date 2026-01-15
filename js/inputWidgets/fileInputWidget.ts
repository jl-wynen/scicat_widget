import { InputWidget } from "./inputWidget";
import { StringInputWidget } from "./stringInputWidget.ts";

export class FileInputWidget extends InputWidget<string> {
    stringInput: StringInputWidget;
    private debounceTimer: number | null = null;
    private previousValue: string | null = null;

    constructor(key: string) {
        super(key);
        this.stringInput = new StringInputWidget(`${key}_path`);

        const el = this.stringInput.element;
        el.addEventListener("input", () => {
            if (this.debounceTimer !== null) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = window.setTimeout(() => {
                this.handleChanged();
                this.debounceTimer = null;
            }, 500);
        });
        el.addEventListener("blur", () => this.handleChanged(), true);
        el.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") this.handleChanged();
        });
    }

    get value(): string | null {
        return this.stringInput.value;
    }

    set value(v: string | null) {
        this.stringInput.value = v;
    }

    get element(): HTMLElement {
        return this.stringInput.element;
    }

    private handleChanged() {
        if (this.previousValue !== this.value) {
            this.previousValue = this.value;
            this.emitUpdated();
        }
    }
}
