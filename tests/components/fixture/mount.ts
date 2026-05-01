import {
    ComboboxInput,
    ComboboxManualInput,
    InputComponent,
    TextInput,
} from "../../../js/components/input";

const INPUT_COMPONENT_TYPES: Record<
    string,
    new (...args: any[]) => InputComponent<any>
> = {
    combobox: ComboboxInput,
    comboboxManual: ComboboxManualInput,
    text: TextInput,
};

declare global {
    interface Window {
        lastEvent: { key: string; value: unknown; userTriggered: boolean } | null;
        mount: (name: string, props: unknown) => void;
        createInputComponent: (
            ty: string,
            key: string,
            ...args: any[]
        ) => [InputComponent<any>, HTMLDivElement];
        setRootChildren: (...nodes: Node[]) => void;
    }
}

window.lastEvent = null;

window.mount = (ty: string, props: any) => {
    const container = window.createInputComponent(ty, props.key, ...props.args)[1];
    window.setRootChildren(container);

    container.addEventListener("input-updated", (e: any) => {
        window.lastEvent = {
            key: e.key,
            value: e.value,
            userTriggered: e.userTriggered,
        };
    });
};

window.createInputComponent = (
    ty: string,
    key: string,
    ...args: any[]
): [InputComponent<any>, HTMLDivElement] => {
    const input = new INPUT_COMPONENT_TYPES[ty](key, ...args);

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = key;

    const wrap = document.createElement("div");
    wrap.append(label, input.container);

    return [input, wrap];
};

window.setRootChildren = (...nodes: Node[]) => {
    const root = document.getElementById("root")!;
    root.innerHTML = "";
    root.replaceChildren(...nodes);
};
