import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createInputWithLabel } from "../forms";
import { DropdownInputWidget } from "./dropdownInputWidget.ts";
import { CheckboxInputWidget } from "./checkboxInputWidget.ts";
import { PersonInputWidget } from "./personInputWidget.ts";
import { OwnersInputWidget } from "./ownersInputWidget.ts";

export class PrincipalInvestigatorInputWidget extends InputWidget<Person> {
    container: HTMLDivElement;
    personWidget: PersonInputWidget;
    ownersInput: OwnersInputWidget;
    sameAsCheckbox: CheckboxInputWidget;
    sameAsDropdown: DropdownInputWidget;

    constructor(key: string, ownersInput: OwnersInputWidget) {
        super(key);
        this.ownersInput = ownersInput;
        const [container, personWidget, sameAsCheckbox, sameAsDropdown] =
            this.createPiWidget();

        const emit = () => this.emitUpdated();
        container.addEventListener("blur", emit, true);
        container.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

        this.container = container;
        this.personWidget = personWidget;
        this.sameAsCheckbox = sameAsCheckbox;
        this.sameAsDropdown = sameAsDropdown;

        this.updateDropdown();
        this.ownersInput.container.addEventListener("input-updated", () => {
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
            `${this.key}_same_as_checkbox`,
            CheckboxInputWidget,
        );
        sameAsLabel.textContent = "same as";
        const sameAsDropdown = new DropdownInputWidget(`${this.key}_same_as`, []);

        const sameAsContainer = document.createElement("div");
        sameAsContainer.classList.add("cean-same-as-container");
        sameAsContainer.appendChild(sameAsCheckbox.container);
        sameAsContainer.appendChild(sameAsLabel);
        sameAsContainer.appendChild(sameAsDropdown.container);

        const personWidget = new PersonInputWidget(`${this.key}_person`, false);

        sameAsCheckbox.container.addEventListener("change", (e) => {
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

        sameAsDropdown.container.addEventListener("change", () => {
            if (sameAsCheckbox.value) {
                this.updateFromDropdown();
            }
        });

        container.appendChild(sameAsContainer);
        container.appendChild(personWidget.container);
        return [
            container,
            personWidget,
            sameAsCheckbox as CheckboxInputWidget,
            sameAsDropdown,
        ];
    }
}
