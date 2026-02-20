import { fieldInfo } from "../assets";
import { InputComponent } from "./input/inputComponent.ts";
import { TextInput } from "./input/textInput.ts";
import { DatetimeInput } from "./input/datetimeInput.ts";
import { PeopleInput } from "./input/peopleInput.ts";

type InputCtor = new (rawInputElement: HTMLInputElement) => InputComponent;
const registry: Record<string, InputCtor> = {
    text: TextInput,
    email: TextInput,
    date: DatetimeInput,
    people: PeopleInput,
};

function componentClass(type: string): InputCtor {
    const ctor = registry[type];
    if (!ctor) throw new Error(`Unknown input type: ${type}`);
    return ctor;
}

export function attachInputComponents(
    fragment: DocumentFragment | HTMLElement,
): Map<string, InputComponent> {
    const components = new Map();

    for (const rawInputElement of fragment.querySelectorAll("input")) {
        const type =
            rawInputElement.getAttribute("data-custom-type") || rawInputElement.type;

        const ctor = componentClass(type);
        const inputComponent = new ctor(rawInputElement);
        components.set(inputComponent.id, inputComponent);

        setLabel(fragment, inputComponent.id);
        rawInputElement.replaceWith(inputComponent.wrapElements());
    }

    return components;
}

function setLabel(parent: DocumentFragment | HTMLElement, id: string) {
    // Extract the raw name if it is prefixed with a parent ID or some UUID.
    // E.g., `owners-abc123-name` is replaced with `name`.
    const name = id.replace(/^(.*-)?([^-]+)$/, "$2");
    const label = parent.querySelector(`label[for="${id}"]`) as HTMLLabelElement | null;
    const info = fieldInfo(name);
    if (label !== null && info !== null) {
        label.textContent = info.label;
        label.title = info.description;
    }
}
