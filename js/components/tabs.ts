import { Config } from "../config.ts";
import { imageLink } from "./output.ts";
import scicatLogo from "../assets/img/SciCat_logo_icon.svg";

export type TabSpec = {
    label: string;
    panel: HTMLElement;
    icon?: string;
    showCount?: boolean;
};

export class Tabs {
    private readonly buttons: HTMLButtonElement[];
    private readonly panels: HTMLDivElement[];
    private readonly countElements: (CountSpanElement | null)[];
    readonly element: HTMLDivElement;

    constructor(spec: TabSpec[], controls: HTMLButtonElement[], config: Config) {
        const [buttons, panels, countElements] = createTabs(spec);
        this.buttons = buttons;
        this.panels = panels;
        this.countElements = countElements;
        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            button.addEventListener("click", this.selectTab.bind(this, i));
            button.addEventListener("keydown", this.onKeyDown.bind(this, i));
        }

        const header = createHeader(buttons, controls, config);
        const contentContainer = createContentContainer(panels);

        this.element = document.createElement("div");
        this.element.classList.add("cean-tabs");
        this.element.append(header, contentContainer);

        this.selectTab(0);
    }

    countElement(index: number): CountSpanElement | null {
        return this.countElements[index];
    }

    private selectTab(index: number) {
        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            const panel = this.panels[i];
            const isSelected = i == index;

            button.setAttribute("aria-selected", isSelected ? "true" : "false");
            if (isSelected) {
                button.removeAttribute("tabindex");
                panel.classList.remove("cean-hidden");
                // panel.focus();
            } else {
                button.setAttribute("tabindex", "-1");
                panel.classList.add("cean-hidden");
            }
        }
    }

    private onKeyDown(index: number, event: KeyboardEvent) {
        let handled = false;

        const selectIndex = (i: number) => {
            this.selectTab(i);
            this.buttons[i].focus();
            handled = true;
        };

        const n = this.buttons.length;
        switch (event.key) {
            case "ArrowRight":
                selectIndex(Math.min(index + 1, n - 1));
                break;
            case "ArrowLeft":
                selectIndex(Math.max(index - 1, 0));
                break;
            case "Home":
                selectIndex(0);
                break;
            case "End":
                selectIndex(n - 1);
                break;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
}

export class CountSpanElement {
    readonly element: HTMLSpanElement;

    constructor() {
        this.element = document.createElement("span");
        this.element.classList.add("cean-tab-count");
        this.set(0);
    }

    set(value: number): void {
        this.element.textContent = `(${value})`;
    }
}

function createTabs(
    spec: TabSpec[],
): [HTMLButtonElement[], HTMLDivElement[], (CountSpanElement | null)[]] {
    const buttons = [];
    const panels = [];
    const countElements = [];
    for (const s of spec) {
        const [button, countElement] = createBaseButton(s);
        const panel = createBasePanel(s);
        button.setAttribute("aria-controls", panel.id);
        panel.setAttribute("aria-labelledby", button.id);
        buttons.push(button);
        panels.push(panel);
        countElements.push(countElement);
    }
    return [buttons, panels, countElements];
}

function createBaseButton(spec: TabSpec): [HTMLButtonElement, CountSpanElement | null] {
    const button = document.createElement("button");
    button.id = crypto.randomUUID();
    button.type = "button";
    button.role = "tab";

    // Make all unselected at construction; one tab will be focused later.
    button.ariaSelected = "false";
    button.tabIndex = -1;

    const label = document.createElement("span");
    label.textContent = spec.label;
    button.append(label);

    if (spec.showCount) {
        const countElement = new CountSpanElement();
        button.append(countElement.element);
        return [button, countElement];
    } else {
        return [button, null];
    }
}

function createBasePanel(spec: TabSpec): HTMLDivElement {
    const panel = document.createElement("div");
    panel.id = crypto.randomUUID();
    panel.role = "tabpanel";
    panel.classList.add("cean-hidden");
    panel.append(spec.panel);
    return panel;
}

function createHeader(
    buttons: HTMLButtonElement[],
    controls: HTMLButtonElement[],
    config: Config,
): HTMLElement {
    const left = document.createElement("div");
    left.classList.add("cean-tabs-branding");
    left.appendChild(imageLink(config.scicatUrl, scicatLogo));

    const middle = document.createElement("div");
    middle.classList.add("cean-tabs-buttons");
    middle.role = "tablist";
    for (const button of buttons) {
        middle.appendChild(button);
    }

    const right = document.createElement("div");
    right.classList.add("cean-tabs-controls");
    right.append(...controls);

    const header = document.createElement("nav");
    header.classList.add("cean-tabs-header");
    header.append(left, middle, right);
    return header;
}

function createContentContainer(panels: HTMLDivElement[]): HTMLDivElement {
    const container = document.createElement("div");
    container.classList.add("cean-tabs-content");
    container.append(...panels);
    return container;
}
