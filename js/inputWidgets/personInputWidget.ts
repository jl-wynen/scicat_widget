import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createInputWithLabel } from "../forms";
import { StringInputWidget } from "./stringInputWidget.ts";

type PersonWidgets = {
    name: InputWidget<string>;
    email: InputWidget<string>;
    orcid?: InputWidget<string>;
};

export class PersonInputWidget extends InputWidget<Person> {
    element: HTMLDivElement;
    widgets: PersonWidgets;

    constructor(hasOrcid: boolean) {
        const [container, widgets] = createPersonWidget(hasOrcid);
        super((v: Person) => {
            setPerson(widgets, v);
        });

        for (const widget of Object.values(widgets)) {
            widget.element.addEventListener("input", () => this.markModified());
        }

        this.element = container;
        this.widgets = widgets;
    }

    get value(): Person | null {
        const nameVal = this.widgets.name?.value;
        const emailVal = this.widgets.email?.value;
        const orcidVal = this.widgets.orcid?.value ?? null;

        if (nameVal === null && emailVal === null && orcidVal === null) return null;

        const person: Person = {
            name: nameVal ?? "",
            email: emailVal ?? "",
        };
        if (orcidVal !== null && orcidVal !== undefined && orcidVal !== "") {
            person.orcid = orcidVal;
        }
        return person;
    }

    disable() {
        this.widgets.name.element.setAttribute("disabled", "true");
        this.widgets.email.element.setAttribute("disabled", "true");
        this.widgets.orcid?.element.setAttribute("disabled", "true");
    }

    enable() {
        this.widgets.name.element.removeAttribute("disabled");
        this.widgets.email.element.removeAttribute("disabled");
        this.widgets.orcid?.element.removeAttribute("disabled");
    }
}

function setPerson(widgets: PersonWidgets, person: Person) {
    widgets.name.setIfUnchanged(person.name);
    widgets.email.setIfUnchanged(person.email);
    widgets.orcid?.setIfUnchanged(person.orcid ?? "");
}

function createPersonWidget(hasOrcid: boolean): [HTMLDivElement, PersonWidgets] {
    // TODO try fieldset
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
