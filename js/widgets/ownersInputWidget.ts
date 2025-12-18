import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createFormElement, createInputWithLabel } from "../forms";
import { StringInputWidget } from "../widgets.ts";

type PersonWidgets = {
    name: InputWidget<string>;
    email: InputWidget<string>;
    orcid?: InputWidget<string>;
};

export class OwnersInputWidget extends InputWidget<Array<Person>> {
    element: HTMLDivElement;
    ownerWidgets: Map<string, PersonWidgets>;

    constructor() {
        const ownerWidgets = new Map();
        const element = createOwnersElement(ownerWidgets) as HTMLDivElement;
        super((v: Array<Person>) => {
            setPersons(element, v);
        });
        // TODO mod detection (all widgets) or does event bubble?

        this.element = element;
        this.ownerWidgets = ownerWidgets;
    }

    get value(): Array<Person> | null {
        return null; // TODO
    }
}

function setPersons(element: HTMLElement, persons: Array<Person>) {
    // TODO
}

function createOwnersElement(ownerWidgets: Map<string, PersonWidgets>): HTMLDivElement {
    const container = createFormElement("div") as HTMLDivElement;

    const ownersContainer = document.createElement("div");
    container.appendChild(ownersContainer);

    function addOwner() {
        const ownerId = crypto.randomUUID();

        const [ownerWrap, widgets] = createSingleOwnerWidget(ownersContainer, ownerId);
        ownersContainer.appendChild(ownerWrap);
        ownerWidgets.set(ownerId, widgets);
        let trashButtons = ownersContainer.querySelectorAll(".cean-remove-item");
        if (trashButtons.length > 1) {
            trashButtons.forEach((button) => {
                button.removeAttribute("disabled");
            });
        } else {
            trashButtons[0].setAttribute("disabled", "true");
        }
    }

    addOwner();

    const addOwnerButton = document.createElement("button");
    addOwnerButton.textContent = "Add owner";
    addOwnerButton.addEventListener("click", () => {
        addOwner();
    });
    container.appendChild(addOwnerButton);

    return container;
}

function createSingleOwnerWidget(
    parent: HTMLElement,
    ownerId: string,
): [HTMLDivElement, PersonWidgets] {
    const container = document.createElement("div");
    container.classList.add("cean-single-owner");

    const [personWrap, widgets] = createPersonWidget(true);
    container.appendChild(personWrap);

    const trashButton = document.createElement("button");
    trashButton.classList.add("cean-remove-item");
    trashButton.textContent = "-";
    trashButton.addEventListener("click", () => {
        parent.removeChild(container);
        const remaining_buttons = parent.querySelectorAll(".cean-remove-item");
        if (remaining_buttons.length === 1) {
            remaining_buttons[0].setAttribute("disabled", "true");
        }
        owners.delete(ownerId);
    });
    container.appendChild(trashButton);

    return [container, widgets];
}

function createPersonWidget(hasOrcid: boolean): [HTMLDivElement, PersonWidgets] {
    const container = document.createElement("div");
    container.classList.add("cean-person-widget");

    const [nameLabel, nameInput] = createInputWithLabel("Name", StringInputWidget);
    container.appendChild(nameLabel);
    container.appendChild(nameInput.element);

    const [emailLabel, emailInput] = createInputWithLabel("Email", StringInputWidget);
    container.appendChild(emailLabel);
    container.appendChild(emailInput.element);

    const widgets = {
        name: nameInput,
        email: emailInput,
    };

    if (hasOrcid) {
        const [orcidLabel, orcidInput] = createInputWithLabel(
            "ORCID",
            StringInputWidget,
        );
        container.appendChild(orcidLabel);
        container.appendChild(orcidInput.element);
        widgets.orcid = orcidInput;
    }

    return widgets;
}
