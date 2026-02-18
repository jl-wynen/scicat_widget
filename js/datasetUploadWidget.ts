import type { AnyModel, RenderProps } from "@anywidget/types";

import { Tabs } from "./tabs.ts";
import { Instrument, Proposal, Techniques } from "./models.ts";
import { BackendComm } from "./comm.ts";
import { styleSheet, widgetTemplate } from "./assets.ts";

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

    // Check if shadowRoot already exists (useful for hot-reloading)
    let shadow = el.shadowRoot;
    if (!shadow) {
        // Need mode: open to access shadow above
        shadow = el.attachShadow({ mode: "open" });
        shadow.appendChild(fragment);
    } else {
        // Clear existing content if hot-reloading
        shadow.replaceChildren(fragment);
    }

    shadow.adoptedStyleSheets = [styleSheet];

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
}

// TODO use
// function createSciCatLogo(scicatUrl: string): HTMLAnchorElement {
//     const anchor = document.createElement("a");
//     anchor.href = scicatUrl;
//     anchor.target = "_blank";
//     anchor.innerHTML = scicatLogo;
//     return anchor;
// }

export default { render };
