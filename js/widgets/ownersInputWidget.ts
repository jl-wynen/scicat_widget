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
        const persons: Array<Person> = [];

        this.ownerWidgets.forEach((widgets) => {
            const nameVal = widgets.name?.value;
            const emailVal = widgets.email?.value;
            const orcidVal = widgets.orcid?.value ?? null;

            if (nameVal === null && emailVal === null && orcidVal === null) return;

            const person: Person = {
                name: nameVal ?? "",
                email: emailVal ?? "",
            };
            if (orcidVal !== null && orcidVal !== undefined && orcidVal !== "") {
                person.orcid = orcidVal;
            }
            persons.push(person);
        });

        return persons.length > 0 ? persons : null;
    }
}

function setPersons(element: HTMLElement, persons: Array<Person>) {
    // TODO
}

function createOwnersElement(ownerWidgets: Map<string, PersonWidgets>): HTMLDivElement {
    const container = createFormElement("div") as HTMLDivElement;

    const ownersContainer = document.createElement("div");
    container.appendChild(ownersContainer);

    container.addEventListener(
        "owner-removed",
        (event) => {
            const custom = event as CustomEvent<{ ownerId: string }>;
            ownerWidgets.delete(custom.detail.ownerId);
        },
        false,
    );

    function addOwner() {
        const ownerId = crypto.randomUUID();

        ownerWidgets.set(ownerId, createSingleOwnerWidget(ownersContainer, ownerId));
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

function createSingleOwnerWidget(parent: HTMLElement, ownerId: string): PersonWidgets {
    const container = document.createElement("div");
    container.classList.add("cean-single-owner");

    const [personWrap, widgets] = createPersonWidget(true);
    container.appendChild(personWrap);

    const trashButton = document.createElement("button");
    trashButton.classList.add("cean-remove-item");
    trashButton.textContent = "-";
    trashButton.addEventListener("click", () => {
        // dispatch before removing the element so the element actually gets emitted:
        container.dispatchEvent(
            new CustomEvent("owner-removed", {
                bubbles: true,
                detail: { ownerId },
            }),
        );

        parent.removeChild(container);
        const remaining_buttons = parent.querySelectorAll(".cean-remove-item");
        if (remaining_buttons.length === 1) {
            remaining_buttons[0].setAttribute("disabled", "true");
        }
    });
    container.appendChild(trashButton);

    parent.appendChild(container);
    return widgets;
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

    const widgets: PersonWidgets = {
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

    return [container, widgets];
}
