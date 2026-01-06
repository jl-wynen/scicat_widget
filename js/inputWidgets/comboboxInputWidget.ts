import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

type Choice = {
    key: string;
    text: string;
    data: any;
};

export class ComboboxInputWidget extends InputWidget<string> {
    element: HTMLElement;
    private searchInput: HTMLInputElement;
    private displayElement: HTMLElement;
    private dropdownList: HTMLElement;
    private choices: Array<Choice>;
    private renderChoice: (choice: Choice) => HTMLElement;
    private _value: string | null = null;
    private isFocused: boolean = false;

    constructor(choices: Array<Choice>, renderChoice: (choice: Choice) => HTMLElement) {
        super();
        this.choices = choices;
        this.renderChoice = renderChoice;

        this.element = createFormElement("div");
        this.element.classList.add("cean-choice-dropdown");

        this.searchInput = document.createElement("input");
        this.searchInput.type = "text";
        this.searchInput.placeholder = "Search...";
        this.searchInput.classList.add("cean-choice-search");
        this.element.appendChild(this.searchInput);

        this.displayElement = document.createElement("div");
        this.displayElement.classList.add("cean-choice-display");
        this.displayElement.style.display = "none";
        this.element.appendChild(this.displayElement);

        this.dropdownList = document.createElement("div");
        this.dropdownList.classList.add("cean-choice-list");
        this.dropdownList.style.display = "none";
        this.element.appendChild(this.dropdownList);

        this.renderChoices();

        this.displayElement.addEventListener("click", () => {
            this.enterEditMode();
        });

        this.searchInput.addEventListener("focus", () => {
            this.isFocused = true;
            this.openDropdown();
            this.searchInput.select();
        });

        this.searchInput.addEventListener("input", () => {
            this.filterItems();
            // this.openDropdown();
        });

        this.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.selectFromSearch();
                this.closeDropdown();
            }
        });

        this.searchInput.addEventListener("blur", () => {
            // Delay to allow mousedown on items to fire first
            setTimeout(() => {
                this.isFocused = false;
                this.selectFromSearch();
                this.closeDropdown();
                this.updateDisplay();
            }, 200);
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!this.element.contains(e.target as Node)) {
                this.closeDropdown();
            }
        });
    }

    private enterEditMode() {
        this.isFocused = true;
        this.updateDisplay();
        this.searchInput.focus();
    }

    private updateDisplay() {
        if (this.isFocused || this._value === null) {
            this.searchInput.style.display = "block";
            this.displayElement.style.display = "none";
        } else {
            this.searchInput.style.display = "none";
            this.displayElement.style.display = "block";
            this.displayElement.innerHTML = "";

            let choice = this.choices.find((c) => c.key === this._value);
            if (!choice) {
                choice = { key: this._value, text: this._value, data: {} };
            }
            this.displayElement.appendChild(this.renderChoice(choice));
        }
    }

    private renderChoices() {
        this.dropdownList.innerHTML = "";
        for (const choice of this.choices) {
            const item = document.createElement("div");
            item.classList.add("cean-choice-item");
            item.dataset.key = choice.key;
            if (choice.key === this._value) {
                item.classList.add("cean-choice-selected");
            }

            const rendered = this.renderChoice(choice);
            item.appendChild(rendered);

            item.addEventListener("mousedown", (e) => {
                // Prevent focus loss from searchInput before we can process the click
                e.preventDefault();
                this.selectChoice(choice);
                this.closeDropdown();
            });
            this.dropdownList.appendChild(item);
        }
    }

    private updateSelectedHighlight() {
        const items = this.dropdownList.querySelectorAll(".cean-choice-item");
        items.forEach((item) => {
            const htmlItem = item as HTMLElement;
            if (htmlItem.dataset.key === this._value) {
                htmlItem.classList.add("cean-choice-selected");
            } else {
                htmlItem.classList.remove("cean-choice-selected");
            }
        });
    }

    private openDropdown() {
        this.dropdownList.style.display = "block";
        this.updateSelectedHighlight();
        this.filterItems();
    }

    private closeDropdown() {
        this.dropdownList.style.display = "none";
    }

    private filterItems() {
        const searchText = this.searchInput.value.toLowerCase();
        const items = this.dropdownList.querySelectorAll(".cean-choice-item");
        items.forEach((item) => {
            const htmlItem = item as HTMLElement;
            if (htmlItem.textContent?.toLowerCase().includes(searchText)) {
                htmlItem.style.display = "block";
            } else {
                htmlItem.style.display = "none";
            }
        });
    }

    private selectChoice(choice: Choice) {
        this.searchInput.value = choice.text;

        if (this._value !== choice.key) {
            this._value = choice.key;
            this.emitUpdated();
        }
        this.searchInput.blur();
    }

    private selectFromSearch() {
        const text = this.searchInput.value;

        if (text === "") {
            if (this._value !== null) {
                this._value = null;
                this.emitUpdated();
            }
            return;
        }

        const choiceByKey = this.choices.find((c) => c.key === text);
        if (choiceByKey) {
            this.selectChoice(choiceByKey);
        } else {
            const choiceByText = this.choices.find((c) => c.text === text);
            if (choiceByText) {
                this.selectChoice(choiceByText);
            } else {
                if (this._value !== text) {
                    this._value = text;
                    this.emitUpdated();
                }
            }
        }
    }

    /**
     * Get the selected key.
     */
    get value(): string | null {
        return this._value;
    }

    /**
     * Set the selection by key.
     */
    set value(key: string | null) {
        if (this._value === key) return;
        this._value = key;
        if (key === null) {
            this.searchInput.value = "";
        } else {
            const choice = this.choices.find((c) => c.key === key);
            if (choice) {
                this.searchInput.value = choice.text;
            } else {
                this.searchInput.value = key;
            }
        }
        this.updateDisplay();
    }
}
