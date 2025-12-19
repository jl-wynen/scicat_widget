import {InputWidget} from "./inputWidget";
import {createFormElement} from "../forms";

export class DatetimeInputWidget extends InputWidget<Date> {
    dateElement: HTMLInputElement;
    timeElement: HTMLInputElement;
    element: HTMLDivElement;

    constructor() {
        super();

        const container = document.createElement("div");
        container.classList.add("cean-datetime-input");

        const dateElement = createFormElement("input") as HTMLInputElement;
        dateElement.type = "date";

        const timeElement = createFormElement("input") as HTMLInputElement;
        timeElement.type = "time";
        timeElement.step = "1";

        container.appendChild(dateElement);
        container.appendChild(timeElement);

        const emit = () => this.emitUpdated();
        dateElement.addEventListener("blur", emit, true);
        timeElement.addEventListener("blur", emit, true);
        dateElement.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });
        timeElement.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

        this.dateElement = dateElement;
        this.timeElement = timeElement;
        this.element = container;
    }

    get value(): Date | null {
        const dateVal = this.dateElement.value;
        if (dateVal === "") return null;

        const timeVal = this.timeElement.value || "00:00:00";
        return new Date(`${dateVal}T${timeVal}`);
    }

    set value(v: Date | null) {
        if (!v) {
            this.dateElement.value = "";
            this.timeElement.value = "";
            return;
        }
        const localDate = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
        const dateString = localDate.toISOString();
        this.dateElement.value = dateString.slice(0, 10);
        this.timeElement.value = dateString.slice(11, 19);
    }
}
