import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createInputWithLabel } from "../forms";
import { DropdownInputWidget } from "./dropdownInputWidget.ts";
import { CheckboxInputWidget } from "./checkboxInputWidget.ts";
import { PersonInputWidget } from "./personInputWidget.ts";

export class PrincipalInvestigatorInputWidget extends InputWidget<Person> {
    element: HTMLDivElement;
    personWidget: PersonInputWidget;

    constructor() {
        const [container, personWidget] = createPiWidget();
        super((v: Person) => {
            this.personWidget.setIfUnchanged(v);
        });

        this.element = container;
        this.personWidget = personWidget;
    }

    get value(): Person | null {
        // TODO implement 'same as' functionality
        return this.personWidget.value;
    }
}

function createPiWidget(): [HTMLDivElement, PersonInputWidget] {
    const container = document.createElement("div");

    const [sameAsLabel, sameAsCheckbox] = createInputWithLabel("", CheckboxInputWidget);
    sameAsLabel.textContent = "same as";
    const sameAsDropdown = new DropdownInputWidget([]);

    const sameAsContainer = document.createElement("div");
    sameAsContainer.classList.add("cean-same-as-container");
    sameAsContainer.appendChild(sameAsCheckbox.element);
    sameAsContainer.appendChild(sameAsLabel);
    sameAsContainer.appendChild(sameAsDropdown.element);

    const personWidget = new PersonInputWidget(false);

    sameAsCheckbox.element.addEventListener("change", (e) => {
        if ((e.target as HTMLInputElement).checked) {
            personWidget.disable();
        } else {
            personWidget.enable();
        }
    });

    container.appendChild(sameAsContainer);
    container.appendChild(personWidget.element);
    return [container, personWidget];
}
