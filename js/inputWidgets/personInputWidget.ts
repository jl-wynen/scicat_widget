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

    constructor(key: string, hasOrcid: boolean) {
        super(key);
        const [container, widgets] = createPersonWidget(key, hasOrcid);

        const emit = () => this.emitUpdated();
        this.element = container;
        this.element.addEventListener("blur", emit, true);
        this.element.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

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

    set value(person: Person | null) {
        if (!person) {
            this.widgets.name.value = "";
            this.widgets.email.value = "";
            if (this.widgets.orcid) this.widgets.orcid.value = "";
        } else {
            this.widgets.name.value = person.name ?? "";
            this.widgets.email.value = person.email ?? "";
            if (this.widgets.orcid) this.widgets.orcid.value = person.orcid ?? "";
        }
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

function createPersonWidget(
    personKey: string,
    hasOrcid: boolean,
): [HTMLDivElement, PersonWidgets] {
    // TODO try fieldset
    const container = document.createElement("div");
    container.classList.add("cean-person-widget");

    const [nameLabel, nameInput] = createInputWithLabel(
        `${personKey}_name`,
        "Name",
        StringInputWidget,
    );
    container.appendChild(nameLabel);
    container.appendChild(nameInput.element);

    const [emailLabel, emailInput] = createInputWithLabel(
        `${personKey}_email`,
        "Email",
        StringInputWidget,
    );
    container.appendChild(emailLabel);
    container.appendChild(emailInput.element);

    const widgets: PersonWidgets = {
        name: nameInput,
        email: emailInput,
    };

    if (hasOrcid) {
        const [orcidLabel, orcidInput] = createInputWithLabel(
            `${personKey}_orcid`,
            "ORCID",
            StringInputWidget,
        );
        container.appendChild(orcidLabel);
        container.appendChild(orcidInput.element);
        widgets.orcid = orcidInput;
    }

    return [container, widgets];
}
