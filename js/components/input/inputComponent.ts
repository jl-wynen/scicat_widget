export abstract class InputComponent {
    readonly id: string;
    readonly required: boolean;

    protected readonly inputElement: HTMLInputElement | HTMLTextAreaElement;
    protected readonly statusElement: HTMLDivElement;

    protected constructor(inputElement: HTMLInputElement | HTMLTextAreaElement) {
        this.id = inputElement.id;
        this.required = inputElement.required;

        this.inputElement = inputElement;

        this.statusElement = document.createElement("div");
        this.statusElement.id = `${this.id}-status`;
    }

    abstract get value(): unknown;

    wrapElements(): HTMLDivElement {
        const wrap = document.createElement("div");
        wrap.className = "input-wrap";
        wrap.append(this.inputElement, this.statusElement);
        return wrap;
    }

    protected static provisionInputElementFrom(
        rawInputElement: HTMLInputElement,
    ): HTMLInputElement {
        const inputElement = document.createElement("input");
        inputElement.id = rawInputElement.id;
        inputElement.type = rawInputElement.type;
        inputElement.required = rawInputElement.required;
        // TODO the grid-span class must be applied to the wrap, not <input>
        inputElement.className = rawInputElement.className;

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
