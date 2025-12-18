import type { RenderProps } from "@anywidget/types";
import "./dataset_widget.css";

interface WidgetModel {}

function createFormElement(tagName: string): HTMLElement {
    const el = document.createElement(tagName);
    el.id = crypto.randomUUID();
    return el;
}

function createLabelFor(target: HTMLElement, label: string): HTMLLabelElement {
    const el = document.createElement("label");
    el.textContent = label;
    el.setAttribute("for", target.id);
    return el;
}

abstract class InputWidget<T> {
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

class StringInputWidget extends InputWidget<string> {
    element: HTMLInputElement | HTMLTextAreaElement;

    constructor(multiLine: boolean = false) {
        const element = makeStringElement(multiLine);
        super((v: string) => {
            element.value = v;
        });
        element.addEventListener("input", () => this.markModified());
        this.element = element;
    }

    get value(): string | null {
        if (this.element.value === "") return null;
        else return this.element.value;
    }
}

function makeStringElement(multiLine: boolean): HTMLInputElement | HTMLTextAreaElement {
    if (multiLine) {
        // TODO enter does not insert new line
        return createFormElement("textarea") as HTMLTextAreaElement;
    } else {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "text";
        return element;
    }
}

class DatetimeInputWidget extends InputWidget<Date> {
    element: HTMLInputElement;

    constructor() {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "datetime-local";
        super((v: Date) => {
            // Convert to UTC because `toISOString` outputs the result correctly:
            element.value = new Date(v.getTime() - v.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
        });
        element.addEventListener("input", () => this.markModified());
        this.element = element;
    }

    get value(): Date | null {
        if (this.element.value === "") return null;
        else return new Date(this.element.value);
    }
}

class CheckboxInputWidget extends InputWidget<boolean> {
    element: HTMLInputElement;

    constructor() {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "checkbox";
        super((v: boolean) => {
            element.checked = v;
        });
        element.addEventListener("input", () => this.markModified());
        this.element = element;
    }

    get value(): boolean {
        return this.element.checked;
    }
}

class DropdownInputWidget extends InputWidget<string> {
    element: HTMLSelectElement;

    constructor(options: Array<string>) {
        const element = createFormElement("select") as HTMLSelectElement;
        super((v: string) => {
            if (options.find((o) => o === v) !== undefined) element.value = v;
        });
        element.addEventListener("input", () => this.markModified());
        options.forEach((option) => {
            const item = document.createElement("option");
            item.value = option;
            item.textContent = option;
            element.appendChild(item);
        });
        this.element = element;
    }

    get value(): string | null {
        if (this.element.value === "") return null;
        else return this.element.value;
    }
}

// TODO suppress shift+enter, else it re-renders the cell!
function render({ model, el }: RenderProps<WidgetModel>) {
    const container = document.createElement("div");

    const inputWidgets = new Map<string, InputWidget<any>>();

    container.appendChild(createGeneralInfoPanel(inputWidgets));

    model.on("msg:custom", (msg) => {
        console.log(`new message: ${JSON.stringify(msg)}`);
        const data: Record<string, any> = {};
        inputWidgets.forEach((widget, key) => {
            data[key] = widget.value;
        });
        model.send({ type: "my-reply", data: data });
    });
    el.appendChild(container);
}

function createGeneralInfoPanel(
    inputWidgets: Map<string, InputWidget<any>>,
): HTMLDivElement {
    const columns = document.createElement("div");
    columns.classList.add("cean-ds-general-info");

    const createAndAppend = (
        parent: HTMLElement,
        label: string,
        varName: string,
        widgetType: new (...args: any[]) => InputWidget<any>,
        ...args: any[]
    ) => {
        const [labelElement, inputWidget] = createInputWithLabel(
            label,
            widgetType,
            ...args,
        );
        parent.appendChild(labelElement);
        parent.appendChild(inputWidget.element);
        inputWidgets.set(varName, inputWidget);
        return inputWidget;
    };

    const nameInput = createAndAppend(columns, "Name", "name", StringInputWidget);
    nameInput.element.classList.add("cean-span-3");

    const descriptionInput = createAndAppend(
        columns,
        "Description",
        "description",
        StringInputWidget,
        true,
    );
    descriptionInput.element.classList.add("cean-span-3");

    const proposalInput = createAndAppend(
        columns,
        "Proposal",
        "proposal_id",
        DropdownInputWidget,
        ["Proposal 1", "Proposal 2"],
    );
    proposalInput.element.classList.add("cean-span-3");

    createAndAppend(columns, "Instrument", "instrument_id", DropdownInputWidget, [
        "DREAM",
        "ODIN",
        "LoKI",
    ]);
    createAndAppend(
        columns,
        "Creation location",
        "creation_location",
        StringInputWidget,
    );

    const runRow = document.createElement("div");
    runRow.classList.add("cean-run-row");
    runRow.classList.add("cean-span-3");

    const [runNumberLabel, runNumberInput] = createInputWithLabel(
        "Run number",
        StringInputWidget,
    );
    inputWidgets.set("run_number", runNumberInput);
    runRow.appendChild(runNumberInput.element);

    createAndAppend(runRow, "Start", "start_time", DatetimeInputWidget);
    createAndAppend(runRow, "End", "end_time", DatetimeInputWidget);

    columns.appendChild(runNumberLabel);
    columns.appendChild(runRow);

    return columns;
}

function createInputWithLabel<T, A extends unknown[]>(
    label: string,
    widgetType: new (...args: A) => InputWidget<T>,
    ...args: A
): [HTMLLabelElement, InputWidget<T>] {
    const inputWidget = new widgetType(...args);
    const labelElement = createLabelFor(inputWidget.element, `${label}:`);
    return [labelElement, inputWidget];
}

export default { render };
