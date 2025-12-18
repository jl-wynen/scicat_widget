import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DatetimeInputWidget extends InputWidget<Date> {
    dateElement: HTMLInputElement;
    timeElement: HTMLInputElement;
    element: HTMLDivElement;

    constructor() {
        const container = document.createElement("div");
        container.classList.add("cean-datetime-input");

        const dateElement = createFormElement("input") as HTMLInputElement;
        dateElement.type = "date";

        const timeElement = createFormElement("input") as HTMLInputElement;
        timeElement.type = "time";
        timeElement.step = "1";

        container.appendChild(dateElement);
        container.appendChild(timeElement);

        super((v: Date) => {
            const localDate = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
            const dateString = localDate.toISOString();
            dateElement.value = dateString.slice(0, 10);
            timeElement.value = dateString.slice(11, 19);
        });

        dateElement.addEventListener("input", () => this.markModified());
        timeElement.addEventListener("input", () => this.markModified());

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
}
