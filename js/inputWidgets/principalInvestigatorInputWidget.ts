import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createInputWithLabel } from "../forms";
import { DropdownInputWidget } from "./dropdownInputWidget.ts";
import { CheckboxInputWidget } from "./checkboxInputWidget.ts";
import { PersonInputWidget } from "./personInputWidget.ts";
import { OwnersInputWidget } from "./ownersInputWidget.ts";

export class PrincipalInvestigatorInputWidget extends InputWidget<Person> {
    personWidget: PersonInputWidget;
    ownersInput: OwnersInputWidget;
    sameAsCheckbox: CheckboxInputWidget;
    sameAsDropdown: DropdownInputWidget;

    constructor(key: string, ownersInput: OwnersInputWidget) {
        // Order of calls such that we can use `this` in `createPiWidget` to create
        // event handlers.
        const wrap = document.createElement("div");
        super(key, wrap);

        const [sameAsContainer, personWidget, sameAsCheckbox, sameAsDropdown] =
            this.createPiWidget();
        wrap.replaceChildren(sameAsContainer, personWidget.container);
        this.ownersInput = ownersInput;

        const emit = () => this.updated();
        wrap.addEventListener("blur", emit, true);
        wrap.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

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

        const personWidget = new PersonInputWidget(`${this.key}_person`, false, true);

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

        return [
            sameAsContainer,
            personWidget,
            sameAsCheckbox as CheckboxInputWidget,
            sameAsDropdown,
        ];
    }
}
