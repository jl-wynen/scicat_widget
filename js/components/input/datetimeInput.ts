import { InputComponent, InputOptions } from "./inputComponent.ts";

export class DatetimeInput extends InputComponent<Date> {
    private readonly dateElement: HTMLInputElement;
    private readonly timeElement: HTMLInputElement;

    constructor(key: string, options: InputOptions<Date>) {
        const dateElement = document.createElement("input");
        dateElement.id = crypto.randomUUID();
        dateElement.name = key;
        dateElement.type = "date";
        dateElement.required = options.required ?? false;
        dateElement.classList.add("cean-input");
        InputComponent.suppressEnter(dateElement);

        const timeElement = document.createElement("input");
        timeElement.id = `${dateElement.id}-time`;
        timeElement.type = "time";
        timeElement.step = "1";
        timeElement.classList.add("cean-input");
        InputComponent.suppressEnter(timeElement);

        const wrap = document.createElement("div");
        wrap.className = "cean-datetime-input";
        wrap.append(dateElement, timeElement);

        super(key, wrap, options);
        this.dateElement = dateElement;
        this.timeElement = timeElement;
        this.addValidationListener(this.dateElement);
    }

    // Custom override so this returns the date element's id, not the wrap element's.
    get id(): string {
        return this.dateElement.id;
    }

    get value(): Date | null {
        const dateVal = this.dateElement.value;
        if (dateVal === "") return null;

        const timeVal = this.timeElement.value || "00:00:00";
        return new Date(`${dateVal}T${timeVal}`);
    }

    setSilent(value: Date | null): void {
        if (!value) {
            this.dateElement.value = "";
            this.timeElement.value = "";
            return;
        }
        const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
        const dateString = localDate.toISOString();
        this.dateElement.value = dateString.slice(0, 10);
        this.timeElement.value = dateString.slice(11, 19);
    }
}
