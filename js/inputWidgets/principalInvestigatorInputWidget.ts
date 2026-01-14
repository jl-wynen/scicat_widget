import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createInputWithLabel } from "../forms";
import { DropdownInputWidget } from "./dropdownInputWidget.ts";
import { CheckboxInputWidget } from "./checkboxInputWidget.ts";
import { PersonInputWidget } from "./personInputWidget.ts";
import { OwnersInputWidget } from "./ownersInputWidget.ts";

export class PrincipalInvestigatorInputWidget extends InputWidget<Person> {
    element: HTMLDivElement;
    personWidget: PersonInputWidget;
    ownersInput: OwnersInputWidget;
    sameAsCheckbox: CheckboxInputWidget;
    sameAsDropdown: DropdownInputWidget;

    constructor(ownersInput: OwnersInputWidget) {
        super();
        this.ownersInput = ownersInput;
        const [container, personWidget, sameAsCheckbox, sameAsDropdown] =
            this.createPiWidget();

        const emit = () => this.emitUpdated();
        container.addEventListener("blur", emit, true);
        container.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

        this.element = container;
        this.personWidget = personWidget;
        this.sameAsCheckbox = sameAsCheckbox;
        this.sameAsDropdown = sameAsDropdown;

        this.updateDropdown();
        this.ownersInput.element.addEventListener("input-updated", () => {
            this.updateDropdown();
        });
    }

    private updateDropdown() {
        const owners = this.ownersInput.value || [];
        this.sameAsDropdown.options = owners.map((o) => o.name).filter((n) => !!n);
        if (this.sameAsCheckbox.value) {
            this.updateFromDropdown();
        }
    }

    private updateFromDropdown() {
        const selectedName = this.sameAsDropdown.value;
        const owners = this.ownersInput.value || [];
        const selectedOwner = owners.find((o) => o.name === selectedName);
        if (selectedOwner) {
            this.personWidget.value = selectedOwner;
        }
    }

    get value(): Person | null {
        return this.personWidget.value;
    }

    set value(v: Person | null) {
        this.personWidget.value = v;
    }

    private createPiWidget(): [
        HTMLDivElement,
        PersonInputWidget,
        CheckboxInputWidget,
        DropdownInputWidget,
    ] {
        const container = document.createElement("div");

        const [sameAsLabel, sameAsCheckbox] = createInputWithLabel(
            "",
            CheckboxInputWidget,
        );
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
                sameAsDropdown.enable();
                this.updateFromDropdown();
            } else {
                personWidget.enable();
                sameAsDropdown.disable();
            }
        });

        sameAsDropdown.disable();

        sameAsDropdown.element.addEventListener("change", () => {
            if (sameAsCheckbox.value) {
                this.updateFromDropdown();
            }
        });

        container.appendChild(sameAsContainer);
        container.appendChild(personWidget.element);
        return [
            container,
            personWidget,
            sameAsCheckbox as CheckboxInputWidget,
            sameAsDropdown,
        ];
    }
}
