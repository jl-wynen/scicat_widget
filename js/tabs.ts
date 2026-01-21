import scicatLogo from "./assets/SciCat_logo_icon.svg";

export interface Tab {
    label: HTMLElement;
    element: HTMLElement;
}

export class Tabs {
    public readonly element: HTMLElement;
    private readonly tabButtonsContainer: HTMLElement;
    private readonly tabs: Tab[];

    constructor(tabs: Tab[], right: HTMLElement[], scicatUrl: string) {
        const [element, tabButtonsContainer, tabPanes, rightContainer] = makeTabs(
            tabs,
            (index) => this.selectTab(index),
            scicatUrl,
        );
        this.element = element;
        this.tabButtonsContainer = tabButtonsContainer;
        this.tabs = tabPanes.map((tab, index) => {
            return { label: tabs[index].label, element: tab };
        });
        insertExtraTopContent(rightContainer, right);
        this.selectTab(1); //TODO set to 0
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
                tab.element.style.visibility = "visible";
            } else {
                tab.element.style.visibility = "hidden";
            }
        });
    }
}

function makeTabs(
    tabs: Tab[],
    selectTab: (index: number) => void,
    scicatUrl: string,
): [HTMLElement, HTMLElement, HTMLElement[], HTMLElement] {
    const container = document.createElement("div");
    container.classList.add("cean-tabs");

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("cean-tab-buttons");
    container.appendChild(buttonContainer);

    const leftContainer = document.createElement("div");
    leftContainer.classList.add("cean-tab-buttons-left");
    leftContainer.appendChild(createSciCatLogo(scicatUrl));
    buttonContainer.appendChild(leftContainer);

    const middleContainer = document.createElement("div");
    middleContainer.classList.add("cean-tab-buttons-middle");
    buttonContainer.appendChild(middleContainer);

    const rightContainer = document.createElement("div");
    rightContainer.classList.add("cean-tab-buttons-right");
    buttonContainer.appendChild(rightContainer);

    const contentContainer = document.createElement("div");
    contentContainer.classList.add("cean-tab-content");
    container.appendChild(contentContainer);

    const tabPanes = fillTabs(middleContainer, contentContainer, tabs, selectTab);

    return [container, buttonContainer, tabPanes, rightContainer];
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
        button.appendChild(tab.label);
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

function createSciCatLogo(scicatUrl: string): HTMLAnchorElement {
    const anchor = document.createElement("a");
    anchor.href = scicatUrl;
    anchor.target = "_blank";
    anchor.innerHTML = scicatLogo;
    return anchor;
}
