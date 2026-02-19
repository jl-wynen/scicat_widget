export abstract class InputComponent {
    readonly id: string;
    readonly required: boolean;

    protected readonly wrapClassName: string;
    protected readonly statusElement: HTMLDivElement;

    protected constructor(rawInputElement: HTMLElement) {
        this.id = rawInputElement.id;
        this.required =
            "required" in rawInputElement &&
            (rawInputElement as HTMLInputElement).required;
        this.wrapClassName = rawInputElement.className;

        this.statusElement = document.createElement("div");
        this.statusElement.id = `${this.id}-status`;
    }

    abstract get value(): unknown;

    abstract wrapElements(): HTMLDivElement;

    protected wrapElementsWith(mainElement: HTMLElement): HTMLDivElement {
        const wrap = document.createElement("div");
        wrap.className = this.wrapClassName;
        wrap.classList.add("input-wrap");
        wrap.append(mainElement, this.statusElement);
        return wrap;
    }

    protected static provisionInputElementFrom(
        rawInputElement: HTMLInputElement,
    ): HTMLInputElement {
        const inputElement = document.createElement("input");
        inputElement.id = rawInputElement.id;
        inputElement.type = rawInputElement.type;
        inputElement.required = rawInputElement.required;

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
