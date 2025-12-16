import type {RenderProps} from "@anywidget/types";
import "./search_dropdown.css";

type Person = {
    name: string,
    email: string,
    orcid?: string,
}

interface WidgetModel {
    // TODO make output work
    owners: Map<string, Person>,
    pi: Map<string,string>,
}

function render({model, el}: RenderProps<WidgetModel>) {
    const owners = makeOwnersWidget();
    const pi = makePersonWidget(model.get("pi"), false);
    el.appendChild(owners);
    el.appendChild(pi);
}

function makeOwnersWidget():HTMLDivElement{
    const container = document.createElement("div");
    const ownerContainer = document.createElement("div");
    container.appendChild(ownerContainer);

    function addOwner() {
        ownerContainer.appendChild(makeSingleOwnerWidget(container));
    }
    addOwner();

    const addButton = document.createElement("button");
    addButton.textContent = "Add owner";
    addButton.addEventListener("click", () => {
        addOwner();
    });
    container.appendChild(addButton);

    return container;
}

function makeSingleOwnerWidget(parent:HTMLElement):HTMLDivElement{
    const container = document.createElement("div");
    const left = document.createElement("div");
    const right = document.createElement("div");

    left.appendChild(makePersonWidget(undefined, true));

    const trashButton = document.createElement("button");
    trashButton.textContent = "-";
    trashButton.addEventListener("click", () => {
        parent.removeChild(container);// TODO make work
    });
    right.appendChild(trashButton);

    container.appendChild(left);
    container.appendChild(right);
    return container;
}

function makePersonWidget(model: Person, hasOrcid: boolean): HTMLDivElement {
    const container = document.createElement("div");
    const name = textInput("Name");
    // TODO add all listeners to sync data
    // name.addEventListener("input", ()=>{model.name = name.textContent;});
    container.appendChild(name);
    const email = textInput("Email");
    container.appendChild(email);
    if (hasOrcid) {
        const orcid = textInput("ORCID iD");
        container.appendChild(orcid);
    }
    return container;
}

function textInput(label:string): HTMLDivElement {
    const container = document.createElement("div")
    const name_input = document.createElement("input");
    const name_label = document.createElement("label");
    name_input.id = crypto.randomUUID();
    name_label.textContent = `${label}:`;
    name_label.setAttribute("for", name_input.id);
    container.appendChild(name_label);
    container.appendChild(name_input);
    return container;
}

export default {render};
