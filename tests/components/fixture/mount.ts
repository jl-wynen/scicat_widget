import { InputComponent, TextInput } from "../../../js/components/input";

const INPUT_COMPONENT_TYPES: Record<
    string,
    new (...args: any[]) => InputComponent<any>
> = {
    text: TextInput,
};

function createInputComponent(ty: string, key: string, ...args: any[]): HTMLDivElement {
    const input = new INPUT_COMPONENT_TYPES[ty](key, ...args);

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = key;

    const wrap = document.createElement("div");
    wrap.append(label, input.container);

    return wrap;
}

declare global {
    interface Window {
        mount: (name: string, props: unknown) => void;
        lastEvent: { key: string; value: unknown; userTriggered: boolean } | null;
    }
}

window.lastEvent = null;

window.mount = (ty: string, props: any) => {
    const root = document.getElementById("root")!;
    root.innerHTML = "";
    const container = createInputComponent(ty, props.key, ...props.args);
    root.appendChild(container);

    container.addEventListener("input-updated", (e: any) => {
        window.lastEvent = {
            key: e.key,
            value: e.value,
            userTriggered: e.userTriggered,
        };
    });
};
