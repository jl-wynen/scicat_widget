export interface Tab {
    label: string;
    element: HTMLElement;
}

export class Tabs {
    public readonly element: HTMLElement;
    private readonly tabButtonsContainer: HTMLElement;
    private readonly tabs: Tab[];

    constructor(tabs: Tab[], right: HTMLElement[]) {
        const [element, tabButtonsContainer, tabPanes] = makeTabs(tabs, (index) =>
            this.selectTab(index),
        );
        this.element = element;
        this.tabButtonsContainer = tabButtonsContainer;
        this.tabs = tabPanes.map((tab, index) => {
            return { label: tabs[index].label, element: tab };
        });
        insertExtraTopContent(this.tabButtonsContainer, right);
        this.selectTab(0);
    }

    private selectTab(index: number) {
        const buttons = this.tabButtonsContainer.querySelectorAll(".cean-tab-button");
        buttons.forEach((btn, i) => {
            if (i === index) {
                btn.classList.add("cean-tab-button-active");
            } else {
                btn.classList.remove("cean-tab-button-active");
            }
        });

        this.tabs.forEach((tab, i) => {
            if (i === index) {
                tab.element.style.display = "";
            } else {
                tab.element.style.display = "none";
            }
        });
    }
}

function makeTabs(
    tabs: Tab[],
    selectTab: (index: number) => void,
): [HTMLElement, HTMLElement, HTMLElement[]] {
    const container = document.createElement("div");
    container.classList.add("cean-tabs");

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("cean-tab-buttons");
    container.appendChild(buttonContainer);

    const contentContainer = document.createElement("div");
    contentContainer.classList.add("cean-tab-content");
    container.appendChild(contentContainer);

    const tabPanes = fillTabs(buttonContainer, contentContainer, tabs, selectTab);

    return [container, buttonContainer, tabPanes];
}

function fillTabs(
    buttonContainer: HTMLElement,
    contentContainer: HTMLElement,
    tabs: Tab[],
    selectTab: (index: number) => void,
): HTMLElement[] {
    const tabPanes: HTMLElement[] = [];
    tabs.forEach((tab, index) => {
        const button = document.createElement("button");
        button.textContent = tab.label;
        button.classList.add("cean-tab-button");
        button.addEventListener("click", () => selectTab(index));
        buttonContainer.appendChild(button);

        const pane = document.createElement("div");
        pane.classList.add("cean-tab-pane");
        pane.appendChild(tab.element);
        tabPanes.push(pane);

        contentContainer.appendChild(pane);
    });
    return tabPanes;
}

function insertExtraTopContent(buttonContainer: HTMLElement, right: HTMLElement[]) {
    right.forEach((el) => buttonContainer.appendChild(el));
}
