import type {RenderProps} from "@anywidget/types";
import "./search_dropdown.css";

type Person = {
    name: string,
    email: string,
    orcid?: string,
}

interface WidgetModel {
    owners: Array<Person>,
    pi: Person,
}

function render({model, el}: RenderProps<WidgetModel>) {
    // TODO doesn't always sync properly with python!
    // Use a Map to allow removing owners and to keep track of ids instead of indices:
    const owners = new Map(model.get("owners").map(owner => [crypto.randomUUID(), owner]));
    const pi = model.get("pi");

    model.on("msg:custom", msg => {
       console.log(`new message: ${JSON.stringify(msg)}`);
       model.send({'type': 'my-reply', 'data': 'response'});
    });

    function syncOwners() {
        model.set("owners", Array.from(owners.values()));
        model.save_changes();
    }

    function syncPi() {
        model.set("pi", {...pi});
        model.save_changes();
    }

    const ownersElement = makeOwnersWidget(owners, syncOwners);
    const piElement = makePersonWidget(pi, false, syncPi);
    el.appendChild(ownersElement);
    el.appendChild(piElement);
}

function makeOwnersWidget(owners: Map<string, Person>, sync: Function): HTMLDivElement {
    const container = document.createElement("div");
    const ownerContainer = document.createElement("div");
    container.appendChild(ownerContainer);

    function addOwner(o: Person|undefined=undefined, id: string|undefined=undefined) {
        const ownerId = id || crypto.randomUUID();
        const owner = o || {name: "", email: "", orcid: ""};
        owners.set(ownerId, owner);
        sync();

        ownerContainer.appendChild(makeSingleOwnerWidget(ownerContainer, owners, ownerId, owner, sync));
        let trashButtons = ownerContainer.querySelectorAll(".cean-remove-item");
        if (trashButtons.length > 1) {
            trashButtons.forEach((button) => {
                button.removeAttribute("disabled");
            });
        } else {
            trashButtons[0].setAttribute("disabled", "true");
        }
    }

    if (owners.size > 0) {
        owners.forEach((owner, ownerId) => {addOwner(owner, ownerId);})
    } else {
        addOwner();
    }

    const addButton = document.createElement("button");
    addButton.textContent = "Add owner";
    addButton.addEventListener("click", () => {
        addOwner();
    });
    container.appendChild(addButton);

    return container;
}

function makeSingleOwnerWidget(parent: HTMLElement, owners: Map<string, Person>, ownerId: string, owner: Person, sync: Function): HTMLDivElement {
    const container = document.createElement("div");
    const left = document.createElement("div");
    const right = document.createElement("div");

    left.appendChild(makePersonWidget(owner, true, sync));

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
        sync();
    });
    right.appendChild(trashButton);

    container.appendChild(left);
    container.appendChild(right);
    return container;
}

function makePersonWidget(person: Person, hasOrcid: boolean, sync: Function): HTMLDivElement {
    const container = document.createElement("div");
    const name = textInput("Name", person.name, inputListener(person, "name", sync));
    container.appendChild(name);
    const email = textInput("Email", person.email, inputListener(person, "email", sync));
    container.appendChild(email);
    if (hasOrcid) {
        const orcid = textInput("ORCID iD", person.orcid, inputListener(person, "orcid", sync));
        container.appendChild(orcid);
    }
    return container;
}

function textInput(label: string, value: string | undefined, listener: (e: FocusEvent) => void): HTMLDivElement {
    const container = document.createElement("div")
    const name_input = document.createElement("input");
    const name_label = document.createElement("label");
    name_input.id = crypto.randomUUID();
    if (value !== undefined) {
        name_input.value = value;
    }
    name_input.onblur = listener;  // use onblur to sync when the user is done editing
    name_label.textContent = `${label}:`;
    name_label.setAttribute("for", name_input.id);
    container.appendChild(name_label);
    container.appendChild(name_input);
    return container;
}

function inputListener(obj: { [k: string]: any }, field: string, sync: Function): (e: FocusEvent) => void {
    return function (event: FocusEvent) {
        obj[field] = (event.target as HTMLInputElement).value;
        sync();
    }
}

export default {render};
