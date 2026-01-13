import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createFormElement } from "../forms";
import { PersonInputWidget } from "./personInputWidget.ts";
import { iconButton } from "../widgets/iconButton.ts";

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
        if (!v) return;

        this.clearOwners();
        let container = this.element.querySelector(".cean-owners-container");
        v.forEach((person) => {
            let owner = addOwner(this.ownerWidgets, container as HTMLElement);
            owner.value = person;
        });
    }

    private clearOwners() {
        this.ownerWidgets.clear();
        this.element.querySelector(".cean-owners-container")?.replaceChildren();
    }
}

function createOwnersElement(
    ownerWidgets: Map<string, PersonInputWidget>,
): HTMLDivElement {
    const container = createFormElement("div") as HTMLDivElement;

    const ownersContainer = document.createElement("div");
    ownersContainer.classList.add("cean-owners-container");
    container.appendChild(ownersContainer);

    container.addEventListener(
        "owner-removed",
        (event) => {
            const custom = event as CustomEvent<{ ownerId: string }>;
            ownerWidgets.delete(custom.detail.ownerId);
        },
        false,
    );

    addOwner(ownerWidgets, ownersContainer);

    const addOwnerButton = document.createElement("button");
    addOwnerButton.classList.add("cean-button");
    addOwnerButton.textContent = "Add owner";
    addOwnerButton.title = "Add owner";
    addOwnerButton.addEventListener("click", () => {
        addOwner(ownerWidgets, ownersContainer);
    });
    container.appendChild(addOwnerButton);

    return container;
}

function addOwner(
    ownerWidgets: Map<string, PersonInputWidget>,
    ownersContainer: HTMLElement,
): PersonInputWidget {
    const ownerId = crypto.randomUUID();

    let widget = createSingleOwnerWidget(ownersContainer, ownerId);
    ownerWidgets.set(ownerId, widget);
    let trashButtons = ownersContainer.querySelectorAll(".cean-remove-item");
    if (trashButtons.length > 1) {
        trashButtons.forEach((button) => {
            button.removeAttribute("disabled");
        });
    } else {
        trashButtons[0].setAttribute("disabled", "true");
    }
    return widget;
}

function createSingleOwnerWidget(
    parent: HTMLElement,
    ownerId: string,
): PersonInputWidget {
    const container = document.createElement("div");
    container.classList.add("cean-single-owner");

    const widget = new PersonInputWidget(true);
    container.appendChild(widget.element);

    const trashButton = iconButton("trash", () => {
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
    trashButton.title = "Remove item";
    trashButton.classList.add("cean-remove-item");
    container.appendChild(trashButton);

    parent.appendChild(container);
    return widget;
}
