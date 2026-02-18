import { InputComponent } from "./inputComponent.ts";

export class DatetimeInput extends InputComponent {
    // Use super.inputElement for the date and this.timeElement for the time.
    private readonly timeElement: HTMLInputElement;

    constructor(rawInputElement: HTMLInputElement) {
        const dateElement = document.createElement("input");
        dateElement.id = rawInputElement.id;
        dateElement.type = "date";
        dateElement.required = rawInputElement.required;
        InputComponent.suppressEnter(dateElement);

        const timeElement = document.createElement("input");
        timeElement.id = `${rawInputElement.id}-time`;
        timeElement.type = "time";
        timeElement.step = "1";
        InputComponent.suppressEnter(timeElement);

        super(dateElement);
        this.timeElement = timeElement;
    }

    get value(): Date | null {
        const dateVal = this.inputElement.value;
        if (dateVal === "") return null;

        const timeVal = this.timeElement.value || "00:00:00";
        return new Date(`${dateVal}T${timeVal}`);
    }

    wrapElements(): HTMLDivElement {
        const datetimeWrap = document.createElement("div");
        datetimeWrap.append(this.inputElement, this.timeElement);

        const wrap = document.createElement("div");
        wrap.className = "input-wrap";
        wrap.append(datetimeWrap, this.statusElement);
        return wrap;
    }
}
