import type { AnyModel, RenderProps } from "@anywidget/types";

import { Tabs } from "./tabs.ts";
import { Instrument, Proposal, Techniques } from "./models.ts";
import { BackendComm } from "./comm.ts";
import { styleSheet, widgetTemplate } from "./assets";
import { imageLink } from "./components/links.ts";
import scicatLogo from "./assets/SciCat_logo_icon.svg";
import { attachInputComponents } from "./components";

interface WidgetModel {
    initial: object;
    instruments: Instrument[];
    proposals: Proposal[];
    accessGroups: string[];
    techniques: Techniques;
    scicatUrl: string;
    skipConfirm: boolean;
}

async function render({ model, el }: RenderProps<WidgetModel>) {
    const comm = new BackendComm(model);

    const fragment = widgetTemplate.content.cloneNode(true) as DocumentFragment;
    const shadow = getOrAttachShadow(el, fragment);

    el.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Enter" && e.shiftKey) {
                // Make sure that shift+enter does not re-run the notebook cell.
                e.stopPropagation();
                e.preventDefault();
            }
        },
        true,
    );

    const tabs = Tabs.attachTo(shadow.firstElementChild as HTMLElement);
    shadow.querySelectorAll(".logo-scicat").forEach((parent) => {
        parent.replaceChildren(imageLink(model.get("scicatUrl"), scicatLogo));
    });
    const inputs = attachInputComponents(shadow);

    // TODO
    shadow.querySelector("button[type='submit']")?.addEventListener("click", (e) => {
        console.log("submitting form with ");
        for (const [name, element] of inputs) {
            console.log("  ", name, element.value);
        }
        e.stopPropagation();
        e.preventDefault();
    });
}

function getOrAttachShadow(
    parent: HTMLElement,
    fragment: DocumentFragment,
): ShadowRoot {
    // Check if shadowRoot already exists (e.g., after hot-reloading)
    let shadow = parent.shadowRoot;
    if (!shadow) {
        // Mode: open so the line above can retrieve the shadow
        shadow = parent.attachShadow({ mode: "open" });
        shadow.appendChild(fragment);
    } else {
        // Clear existing content if hot-reloading
        shadow.replaceChildren(fragment);
    }

    shadow.adoptedStyleSheets = [styleSheet];

    return shadow;
}

export default { render };
