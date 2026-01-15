import { InputWidget } from "./inputWidget";
import { StringInputWidget } from "./stringInputWidget.ts";

export class FileInputWidget extends InputWidget<string> {
    stringInput: StringInputWidget;
    private debounceTimer: number | null = null;
    private previousValue: string | null = null;

    constructor(key: string) {
        const input = new StringInputWidget(`${key}_path`);
        const elememt = input.container;
        elememt.addEventListener("input", () => {
            if (this.debounceTimer !== null) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = window.setTimeout(() => {
                this.handleChanged();
                this.debounceTimer = null;
            }, 500);
        });
        elememt.addEventListener("blur", () => this.handleChanged(), true);
        elememt.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") this.handleChanged();
        });

        super(key, elememt);
        this.stringInput = input;
    }

    get value(): string | null {
        return this.stringInput.value;
    }

    set value(v: string | null) {
        this.stringInput.value = v;
    }

    get container(): HTMLElement {
        return this.stringInput.container;
    }

    private handleChanged() {
        if (this.previousValue !== this.value) {
            this.previousValue = this.value;
            this.emitUpdated();
        }
    }
}
