import type { RenderProps } from "@anywidget/types";
import "./dataset_widget.css";
import { DatetimeInputWidget, DropdownInputWidget, InputWidget, StringInputWidget } from "./widgets";

interface WidgetModel {}

/**
 * Create a label for a form element.
 *
 * @param target The form element the label is for. Must have an `id`.
 * @param label The label text.
 */
export function createLabelFor(target: HTMLElement, label: string): HTMLLabelElement {
    const el = document.createElement("label");
    el.textContent = label;
    el.setAttribute("for", target.id);
    return el;
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
