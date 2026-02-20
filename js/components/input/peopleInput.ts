import { InputComponent } from "./inputComponent.ts";
import { Person } from "../../models.ts";
import { textButton, removeButton } from "../button.ts";
import { attachInputComponents } from "../index.ts";
import { TextInput } from "./textInput.ts";
import { validateOrcid } from "../../validation.ts";

export class PeopleInput extends InputComponent {
    private peopleComponents: Map<string, PersonInput>;
    private readonly peopleContainer: HTMLDivElement;

    constructor(rawInputElement: HTMLInputElement) {
        super(rawInputElement);
        this.peopleComponents = new Map();

        this.peopleContainer = document.createElement("div");
        this.peopleContainer.className = "people";

        this.addPerson();
    }

    get value(): Person[] | null {
        const results = Array.from(this.peopleComponents.values())
            .map((component) => component.value)
            .filter((value): value is Person => value !== null);
        return results.length > 0 ? results : null;
    }

    wrapElements(): HTMLDivElement {
        const addButton = textButton(
            "Add person",
            this.addPerson.bind(this),
            "Add person",
        );

        const widget = document.createElement("div");
        widget.append(this.peopleContainer, addButton);
        return this.wrapElementsWith(widget);
    }

    private addPerson() {
        const personInput = new PersonInput(this.id, this.removePerson.bind(this));
        this.peopleComponents.set(personInput.id, personInput);
        this.peopleContainer.append(personInput.element);
    }

    private removePerson(id: string) {
        this.peopleComponents.get(id)?.element.remove();
        this.peopleComponents.delete(id);
        if (this.peopleComponents.size === 0) {
            this.addPerson();
        }
    }
}

class PersonInput {
    readonly id: string;
    private readonly fieldset: HTMLFieldSetElement;
    private readonly inputs: Map<string, TextInput>;

    constructor(baseId: string, onRemove: (id: string) => void) {
        this.id = `${baseId}-${crypto.randomUUID()}`;

        this.fieldset = document.createElement("fieldset");
        this.fieldset.id = this.id;
        this.fieldset.className = "person";
        this.fieldset.innerHTML = `<div class="input-grid">
<label for="${this.id}-personName"></label>
<input id="${this.id}-personName" type="text" required>
<label for="${this.id}-personEmail"></label>
<input id="${this.id}-personEmail" type="email">
<label for="${this.id}-personORCID"></label>
<input id="${this.id}-personORCID" type="text">
</div>`;

        this.fieldset.appendChild(
            removeButton(() => {
                onRemove(this.id);
            }),
        );

        this.inputs = attachInputComponents(this.fieldset) as Map<string, TextInput>;
        this.inputs.get(`${this.id}-personORCID`)!.customValidator = validateOrcid;
    }

    get value(): Person | null {
        const name = this.inputs.get(`${this.id}-personName`)?.value;
        const email = this.inputs.get(`${this.id}-personEmail`)?.value;
        const orcid = this.inputs.get(`${this.id}-personORCID`)?.value;
        if (!name && !email && !orcid) {
            return null;
        }
        return {
            name: name ?? "", // Validation will fail if the name is empty because it is `required`.
            email: email ?? undefined,
            orcid: orcid ?? undefined,
        };
    }

    get element(): HTMLFieldSetElement {
        return this.fieldset;
    }
}
