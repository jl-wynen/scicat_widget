import { InputComponent } from "./inputComponent.ts";
import { Person } from "../../models.ts";

export class PeopleInput extends InputComponent {
    peopleComponents: Map<string, PersonInput>;

    constructor(rawInputElement: HTMLInputElement) {
        super(rawInputElement);
        this.peopleComponents = new Map();
    }

    get value(): Person[] | null {
        const results = Array.from(this.peopleComponents.values())
            .map((component) => component.value)
            .filter((value): value is Person => value !== null);
        return results.length > 0 ? results : null;
    }

    wrapElements(): HTMLDivElement {
        return document.createElement("div");
    }
}

class PersonInput {
    readonly id: string;

    constructor(baseId: string) {
        this.id = `${baseId}-${crypto.randomUUID()}`;
    }

    get value(): Person | null {
        return null; // TODO
    }
}
