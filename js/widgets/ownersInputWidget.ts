import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createFormElement, createInputWithLabel } from "../forms";
import { StringInputWidget } from "../widgets.ts";

export class OwnersInputWidget extends InputWidget<Array<Person>> {
    element: HTMLDivElement;
    owners: Map<string, Person>; // TODO use map to widgets

    constructor() {
        const owners = new Map();
        const element = createOwnersElement(owners) as HTMLDivElement;
        super((v: Array<Person>) => {
            setPersons(element, v);
        });
        // TODO mod detection (all widgets) or does event bubble?

        this.element = element;
        this.owners = owners;
    }

    get value(): Array<Person> | null {
        return null; // TODO
    }
}

function setPersons(element: HTMLElement, persons: Array<Person>) {
    // TODO
}

function createOwnersElement(owners: Map<string, Person>): HTMLDivElement {
    const container = createFormElement("div") as HTMLDivElement;

    const ownersContainer = document.createElement("div");
    container.appendChild(ownersContainer);

    function addOwner(): string {
        const ownerId = crypto.randomUUID();
        const owner = { name: "", email: "", orcid: "" };
        owners.set(ownerId, owner);

        ownersContainer.appendChild(
            createSingleOwnerWidget(ownersContainer, owners, ownerId, owner),
        );
        let trashButtons = ownersContainer.querySelectorAll(".cean-remove-item");
        if (trashButtons.length > 1) {
            trashButtons.forEach((button) => {
                button.removeAttribute("disabled");
            });
        } else {
            trashButtons[0].setAttribute("disabled", "true");
        }

        return ownerId;
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
    owners: Map<string, Person>,
    ownerId: string,
    owner: Person,
): HTMLDivElement {
    const container = document.createElement("div");
    container.classList.add("cean-single-owner");

    container.appendChild(createPersonWidget(owner, true));

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
    return container;
}

function createPersonWidget(person: Person, hasOrcid: boolean): HTMLDivElement {
    const container = document.createElement("div");
    container.classList.add("cean-person-widget");

    const [nameLabel, nameInput] = createInputWithLabel("Name", StringInputWidget);
    container.appendChild(nameLabel);
    container.appendChild(nameInput.element);

    const [emailLabel, emailInput] = createInputWithLabel("Email", StringInputWidget);
    container.appendChild(emailLabel);
    container.appendChild(emailInput.element);

    if (hasOrcid) {
        const [orcidLabel, orcidInput] = createInputWithLabel(
            "ORCID",
            StringInputWidget,
        );
        container.appendChild(orcidLabel);
        container.appendChild(orcidInput.element);
    }

    return container;
}
