import { fieldInfo } from "../assets";
import { InputComponent } from "./input/inputComponent.ts";
import { TextInput } from "./input/textInput.ts";
import { DatetimeInput } from "./input/datetimeInput.ts";

type InputCtor = new (rawInputElement: HTMLInputElement) => InputComponent;
const registry: Record<string, InputCtor> = {
    text: TextInput,
    date: DatetimeInput,
};

function componentClass(type: string): InputCtor {
    const ctor = registry[type];
    if (!ctor) throw new Error(`Unknown input type: ${type}`);
    return ctor;
}

export function attachInputComponents(shadow: ShadowRoot): Map<string, InputComponent> {
    const components = new Map();

    for (const rawInputElement of shadow.querySelectorAll("input")) {
        const ctor = componentClass(rawInputElement.type);
        const inputComponent = new ctor(rawInputElement);
        components.set(inputComponent.id, inputComponent);

        setLabel(shadow, inputComponent.id);
        rawInputElement.replaceWith(inputComponent.wrapElements());
    }

    return components;
}

function setLabel(parent: DocumentFragment, name: string) {
    const label = parent.querySelector(
        `label[for="${name}"]`,
    ) as HTMLLabelElement | null;
    const info = fieldInfo(name);
    if (label !== null && info !== null) {
        label.textContent = info.label;
        label.title = info.description;
    }
}
