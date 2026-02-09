import { InputWidget } from "./inputWidget";
import { Person } from "../models";
import { createInputWithLabel } from "../forms";
import { StringInputWidget } from "./stringInputWidget.ts";
import { validateEmail, validateOrcid } from "../validation";

type PersonWidgets = {
    name: InputWidget<string>;
    email: InputWidget<string>;
    orcid?: InputWidget<string>;
};

export class PersonInputWidget extends InputWidget<Person> {
    widgets: PersonWidgets;

    constructor(key: string, hasOrcid: boolean, emailRequired: boolean) {
        const [wrap, widgets] = createPersonWidget(key, hasOrcid, emailRequired);

        const emit = () => this.updated();
        wrap.addEventListener("blur", emit, true);
        wrap.addEventListener("keydown", (e) => {
            if ((e as KeyboardEvent).key === "Enter") emit();
        });

        super(key, wrap);
        wrap.classList.remove("cean-input");
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
        if (orcidVal !== null && orcidVal !== "") {
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
}

function createPersonWidget(
    personKey: string,
    hasOrcid: boolean,
    emailRequired: boolean,
): [HTMLDivElement, PersonWidgets] {
    // TODO try fieldset
    const container = document.createElement("div");
    container.classList.add("cean-person-widget");

    const [nameLabel, nameInput] = createInputWithLabel(
        `${personKey}_name`,
        StringInputWidget,
        [{ required: true }],
        "Name",
    );
    container.appendChild(nameLabel);
    container.appendChild(nameInput.container);

    const [emailLabel, emailInput] = createInputWithLabel(
        `${personKey}_email`,
        StringInputWidget,
        [{ validator: validateEmail, required: emailRequired }],
        "Email",
    );
    container.appendChild(emailLabel);
    container.appendChild(emailInput.container);

    const widgets: PersonWidgets = {
        name: nameInput,
        email: emailInput,
    };

    if (hasOrcid) {
        const [orcidLabel, orcidInput] = createInputWithLabel(
            `${personKey}_orcid`,
            StringInputWidget,
            [{ validator: validateOrcid }],
            "ORCID",
        );
        container.appendChild(orcidLabel);
        container.appendChild(orcidInput.container);
        widgets.orcid = orcidInput;
    }

    return [container, widgets];
}
