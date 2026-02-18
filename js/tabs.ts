export class Tabs {
    private constructor(
        private readonly buttons: HTMLButtonElement[],
        private readonly panels: HTMLElement[],
        private readonly tabNames: string[],
    ) {
        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            button.addEventListener("click", this.selectTab.bind(this, i));
            button.addEventListener("keydown", this.onKeyDown.bind(this, i));
        }
    }

    static attachTo(element: HTMLElement) {
        const buttons: HTMLButtonElement[] = [];
        const panels: HTMLElement[] = [];
        const tabNames: string[] = [];

        element.querySelectorAll("[role='tabpanel']").forEach((panel) => {
            const tabName = panel.id.split("-")[1];

            const button = element.querySelector(`[aria-controls="${panel.id}"]`);
            if (button === null) {
                throw new Error(`No button found for tab panel ${panel.id}`);
            }

            buttons.push(button as HTMLButtonElement);
            panels.push(panel as HTMLElement);
            tabNames.push(tabName);
        });

        return new Tabs(buttons, panels, tabNames);
    }

    getButton(name: string): HTMLButtonElement {
        return this.buttons[this.tabNames.indexOf(name)];
    }

    private selectTab(index: number) {
        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            const panel = this.panels[i];
            const isSelected = i == index;

            button.setAttribute("aria-selected", isSelected ? "true" : "false");
            if (isSelected) {
                button.removeAttribute("tabindex");
                panel.classList.remove("hidden");
                // panel.focus();
            } else {
                button.setAttribute("tabindex", "-1");
                panel.classList.add("hidden");
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
