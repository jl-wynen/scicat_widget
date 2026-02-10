import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DatetimeInputWidget extends InputWidget<Date> {
    dateElement: HTMLInputElement;
    timeElement: HTMLInputElement;

    constructor(key: string) {
        const wrap = document.createElement("div");
        wrap.classList.add("cean-datetime-input");

        const dateElement = createFormElement("input") as HTMLInputElement;
        dateElement.classList.add("cean-input");
        dateElement.type = "date";

        const timeElement = createFormElement("input") as HTMLInputElement;
        timeElement.classList.add("cean-input");
        timeElement.type = "time";
        timeElement.step = "1";

        wrap.appendChild(dateElement);
        wrap.appendChild(timeElement);

        const emit = () => {
            this.updated();
        };
        dateElement.addEventListener("blur", emit, true);
        timeElement.addEventListener("blur", emit, true);
        dateElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter") emit();
        });
        timeElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter") emit();
        });

        super(key, wrap);
        this.dateElement = dateElement;
        this.timeElement = timeElement;
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

    get id(): string {
        return this.dateElement.id;
    }
}
