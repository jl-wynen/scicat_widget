import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createFormElement } from "../forms";
import { PersonInputWidget } from "./personInputWidget.ts";
import { removeButton } from "../widgets/iconButton.ts";

export class OwnersInputWidget extends InputWidget<Array<Person>> {
    ownerWidgets: Map<string, PersonInputWidget>;

    constructor(key: string) {
        const ownerWidgets = new Map();
        const element = createOwnersElement(ownerWidgets) as HTMLDivElement;

        const emit = () => this.updated();
        element.addEventListener("blur", emit, true);
        element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

        super(key, element);
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
        let container = this.container.querySelector(".cean-owners-container");
        v.forEach((person) => {
            let owner = addOwner(this.ownerWidgets, container as HTMLElement);
            owner.value = person;
        });
        if (v.length === 0) {
            addOwner(this.ownerWidgets, container as HTMLElement);
        }
        // Need this to update the PI widget.
        this.updated();
    }

    private clearOwners() {
        this.ownerWidgets.clear();
        this.container.querySelector(".cean-owners-container")?.replaceChildren();
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

    let widget = createSingleOwnerWidget(ownersContainer, ownerId, ownerWidgets);
    ownerWidgets.set(ownerId, widget);
    return widget;
}

function createSingleOwnerWidget(
    parent: HTMLElement,
    ownerId: string,
    ownerWidgets: Map<string, PersonInputWidget>,
): PersonInputWidget {
    const container = document.createElement("div");
    container.classList.add("cean-single-owner");

    const widget = new PersonInputWidget(ownerId, true, false);
    container.appendChild(widget.container);

    container.appendChild(
        removeButton(() => {
            // dispatch before removing the element so the element actually gets emitted:
            container.dispatchEvent(
                new CustomEvent("owner-removed", {
                    bubbles: true,
                    detail: { ownerId },
                }),
            );

            parent.removeChild(container);
            if (ownerWidgets.size === 0) {
                addOwner(ownerWidgets, parent);
            }
        }),
    );

    parent.appendChild(container);
    return widget;
}
