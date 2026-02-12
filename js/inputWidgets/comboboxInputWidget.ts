import { InputWidget } from "./inputWidget";
import { animateValueSet } from "../style.ts";

export type Choice = {
    key: string;
    text: string;
    data: unknown;
};

export type Args = {
    choices: Choice[];
    renderChoice: (choice: Choice) => HTMLElement;
    allowArbitrary: true;
    filter: true;
    required: false;
};

export class ComboboxInputWidget extends InputWidget<string> {
    private readonly searchInput: HTMLInputElement;
    private readonly displayElement: HTMLElement;
    private readonly dropdownList: HTMLElement;
    private readonly choices: Choice[];
    private readonly renderChoice: (choice: Choice) => HTMLElement;
    private readonly allowArbitrary: boolean;
    private readonly filter: boolean;
    private _value: string | null = null;
    private isFocused = false;
    private isMouseDownInside = false;

    constructor(
        key: string,
        { choices, renderChoice, allowArbitrary, filter, required }: Args,
    ) {
        const wrap = document.createElement("div");
        wrap.classList.add("cean-combox-dropdown");

        super(key, wrap, required);
        this.choices = choices;
        this.renderChoice = renderChoice;
        this.allowArbitrary = allowArbitrary;
        this.filter = filter;

        this.searchInput = document.createElement("input");
        this.searchInput.id = crypto.randomUUID();
        this.searchInput.type = "text";
        this.searchInput.placeholder = "Search...";
        this.searchInput.classList.add("cean-combox-search", "cean-input");
        this.searchInput.style.display = "none";
        wrap.appendChild(this.searchInput);

        this.displayElement = document.createElement("div");
        this.displayElement.classList.add("cean-combox-display", "cean-input");
        wrap.appendChild(this.displayElement);
        this.showPlaceholder();

        const arrowIcon = document.createElement("i");
        arrowIcon.className = "fa fa-chevron-down cean-combox-arrow";
        wrap.appendChild(arrowIcon);
        arrowIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            this.enterEditMode();
        });

        this.dropdownList = document.createElement("div");
        this.dropdownList.classList.add("cean-combox-list");
        this.dropdownList.style.display = "none";
        wrap.appendChild(this.dropdownList);

        this.renderChoices();

        // Track interactions inside to keep the dropdown open when using the scrollbar
        this.container.addEventListener("mousedown", () => {
            this.isMouseDownInside = true;
        });
        document.addEventListener("mouseup", () => {
            this.isMouseDownInside = false;
        });

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
            this.openDropdown();
        });

        this.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.selectFromSearch();
                this.closeDropdown();
            } else if (e.key == "Escape") {
                e.preventDefault();
                this.closeDropdown();
            }
        });

        this.searchInput.addEventListener("blur", () => {
            this.isFocused = false;

            // If blur happened while interacting inside the dropdown (e.g., clicking the scrollbar),
            // keep it open and restore focus to the input so the user can continue.
            if (this.isMouseDownInside) {
                this.searchInput.focus();
                return;
            }

            this.selectFromSearch();
            this.closeDropdown();
            this.updateDisplay();
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!this.container.contains(e.target as Node)) {
                this.closeDropdown();
            }
        });
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
            const choice = this.findChoice(key);
            if (choice) {
                this.searchInput.value = choice.text;
            } else {
                this.searchInput.value = key;
            }
        }
        this.updateDisplay();
        animateValueSet(this.displayElement);
        this.updated(false);
    }

    get id(): string {
        return this.searchInput.id;
    }

    private enterEditMode() {
        this.isFocused = true;
        this.updateDisplay();
        this.searchInput.focus();
    }

    private updateDisplay() {
        if (this.isFocused || (this._value === null && this.allowArbitrary)) {
            this.searchInput.style.display = "block";
            this.displayElement.style.display = "none";
        } else {
            this.searchInput.style.display = "none";
            this.displayElement.style.display = "block";
            this.displayElement.innerHTML = "";

            if (this._value === null) {
                this.showPlaceholder();
                return;
            }

            let choice = this.findChoice(this._value);
            choice ??= { key: this._value, text: this._value, data: {} };
            this.displayElement.appendChild(this.renderChoice(choice));
        }
    }

    private renderChoices() {
        this.dropdownList.innerHTML = "";
        for (const choice of this.choices) {
            const item = document.createElement("div");
            item.classList.add("cean-combox-item");
            item.dataset.key = choice.key;
            if (choice.key === this._value) {
                item.classList.add("cean-combox-selected");
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
        const items = this.dropdownList.querySelectorAll(".cean-combox-item");
        items.forEach((item) => {
            const htmlItem = item as HTMLElement;
            if (htmlItem.dataset.key === this._value) {
                htmlItem.classList.add("cean-combox-selected");
            } else {
                htmlItem.classList.remove("cean-combox-selected");
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
        if (!this.filter) {
            return;
        }

        const searchText = this.searchInput.value.toLowerCase();
        const items = this.dropdownList.querySelectorAll(".cean-combox-item");
        items.forEach((item) => {
            const htmlItem = item as HTMLElement;
            if (htmlItem.textContent.toLowerCase().includes(searchText)) {
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
            this.updated();
        }
        this.searchInput.blur();
    }

    private selectFromSearch() {
        const text = this.searchInput.value;

        if (text === "") {
            if (this._value !== null) {
                this._value = null;
                this.updated();
            }
            return;
        }

        const choice = this.findChoice(text, true);
        if (choice) {
            this.selectChoice(choice);
            return;
        }

        if (this.allowArbitrary) {
            if (this._value !== text) {
                this._value = text;
                this.updated();
            }
            this.searchInput.blur();
        } else {
            if (this._value !== null) {
                this._value = null;
                this.updated();
            }
            this.updateDisplay();
        }
    }

    private findChoice(value: string, allowText = false): Choice | null {
        const byKey = this.choices.find((c) => c.key === value);
        if (byKey) return byKey;
        if (allowText) {
            return this.choices.find((c) => c.text === value) ?? null;
        }
        return null;
    }

    private showPlaceholder() {
        this.displayElement.textContent = this.allowArbitrary ? "Search…" : "Select…";
    }
}
