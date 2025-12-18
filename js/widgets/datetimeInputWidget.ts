import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

export class DatetimeInputWidget extends InputWidget<Date> {
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
