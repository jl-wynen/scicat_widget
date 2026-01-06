import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createFormElement } from "../forms";
import { PersonInputWidget } from "./personInputWidget.ts";

export class OwnersInputWidget extends InputWidget<Array<Person>> {
    element: HTMLDivElement;
    ownerWidgets: Map<string, PersonInputWidget>;

    constructor() {
        super();
        const ownerWidgets = new Map();
        const element = createOwnersElement(ownerWidgets) as HTMLDivElement;

        const emit = () => this.emitUpdated();
        element.addEventListener("blur", emit, true);
        element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

        this.element = element;
        this.ownerWidgets = ownerWidgets;
    }

    get value(): Array<Person> | null {
        const persons: Array<Person> = [];

        this.ownerWidgets.forEach((widgets) => {
            const person = widgets.value;
            if (person !== null) persons.push(person);
        });

        return persons.length > 0 ? persons : null;
    }

    set value(v: Array<Person> | null) {
        if (!v) return; // TODO: implement UI update for owners list
        setPersons(this.element, v);
    }
}

function setPersons(_element: HTMLElement, _persons: Array<Person>) {
    // TODO
}

function createOwnersElement(
    ownerWidgets: Map<string, PersonInputWidget>,
): HTMLDivElement {
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
    addOwnerButton.classList.add("cean-button");
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
): PersonInputWidget {
    const container = document.createElement("div");
    container.classList.add("cean-single-owner");

    const widget = new PersonInputWidget(true);
    container.appendChild(widget.element);

    const trashButton = document.createElement("button");
    trashButton.classList.add("cean-remove-item");
    trashButton.classList.add("cean-button");
    trashButton.innerHTML = '<i class="fa fa-trash"></i>';
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
    return widget;
}
