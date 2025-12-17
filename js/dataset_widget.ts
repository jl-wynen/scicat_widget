import type {RenderProps} from "@anywidget/types";
import "./dataset_widget.css";

interface WidgetModel {

}

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

abstract class BaseValueWidget<T> {
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
}

class StringInputWidget extends BaseValueWidget<string> {
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
        return createFormElement("textarea") as HTMLTextAreaElement;
    } else {
        const element = createFormElement("input") as HTMLInputElement;
        element.type = "text";
        return element;
    }
}

class DatetimeInputWidget extends BaseValueWidget<Date> {
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

class CheckboxInputWidget extends BaseValueWidget<boolean> {
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

class DropdownInputWidget extends BaseValueWidget<string> {
    element: HTMLSelectElement;

    constructor(options: Array<string>) {
        const element = createFormElement("select") as HTMLSelectElement;
        super((v: string) => {
            if (options.find(o => o === v) !== undefined) element.value = v;
        });
        element.addEventListener("input", () => this.markModified());
        options.forEach(option => {
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

function render({model, el}: RenderProps<WidgetModel>) {
    const container = document.createElement("div");

    const inputWidgets = new Map<string, BaseValueWidget<any>>();

    const columns = document.createElement("div");
    columns.classList.add("cean-two-columns");

    const nameInput = new StringInputWidget();
    const nameLabel = createLabelFor(nameInput.element, "Name:");
    inputWidgets.set("name", nameInput);
    columns.appendChild(nameLabel);
    nameInput.element.classList.add("cean-span-3");
    columns.appendChild(nameInput.element);

    const descriptionInput = new StringInputWidget(true);
    const descriptionLabel = createLabelFor(descriptionInput.element, "Description:");
    inputWidgets.set("description", descriptionInput);
    columns.appendChild(descriptionLabel);
    descriptionInput.element.classList.add("cean-span-3");
    columns.appendChild(descriptionInput.element);

    const proposalInput = new StringInputWidget();
    const proposalLabel = createLabelFor(proposalInput.element, "Proposal:");
    inputWidgets.set("proposal", proposalInput);
    columns.appendChild(proposalLabel);
    proposalInput.element.classList.add("cean-span-3");
    columns.appendChild(proposalInput.element);

    const instrumentInput = new StringInputWidget();
    const instrumentLabel = createLabelFor(instrumentInput.element, "Instrument:");
    inputWidgets.set("instrument", instrumentInput);
    columns.appendChild(instrumentLabel);
    columns.appendChild(instrumentInput.element);

    const creationLocationInput = new StringInputWidget();
    const creationLocationLabel = createLabelFor(creationLocationInput.element, "creationLocation:");
    inputWidgets.set("Creation Location", creationLocationInput);
    columns.appendChild(creationLocationLabel);
    columns.appendChild(creationLocationInput.element);

    container.appendChild(columns);

    model.on("msg:custom", msg => {
        console.log(`new message: ${JSON.stringify(msg)}`);
        const data: Record<string, any> = {};
        inputWidgets.forEach((widget, key) => {
            data[key] = widget.value;
        });
        model.send({'type': 'my-reply', 'data': data});
    });
    el.appendChild(container);
}

export default {render};
