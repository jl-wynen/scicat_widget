import { InputComponent, InputOptions } from "./inputComponent.ts";
import { iconButton } from "../button.ts";

/*
TODO Better display = search
 - Do not use textContent for search
 -  Do not insert textContent into search bar
 - Use Choice.text
        Can be stored in the option with option.label = choice.text
 */

export type Choice = {
    key: string;
    text: string;
};

export interface Options extends InputOptions<string> {
    renderChoice?: (choice: Choice) => HTMLElement;
    filter?: boolean;
}

/**
 * Input component to select text from a list of options.
 */
export class ComboboxInput extends InputComponent<string> {
    private readonly datalist: HTMLDataListElement;
    private readonly searchBar: HTMLInputElement;
    private readonly clearButton: HTMLButtonElement;

    private error: string = "";
    private readonly closeListener: (e: PointerEvent) => void;

    constructor(key: string, choices: Choice[], options: Options) {
        const datalist = createDatalist(choices, options.renderChoice);
        const searchBar = createSearchBar(
            key,
            datalist,
            () => {
                this.open();
            },
            () => {
                this.close();
            },
        );
        const [insert, clearButton] = createSearchInsert(searchBar, () => {
            this.setSignaling("");
            this.searchBar.focus();
        });

        const container = document.createElement("div");
        container.id = crypto.randomUUID();
        container.className = "cean-combobox";
        container.append(searchBar, datalist, insert);

        super(key, container, options);

        this.datalist = datalist;
        this.searchBar = searchBar;
        this.clearButton = clearButton;

        this.searchBar.addEventListener("focus", this.open.bind(this));
        this.searchBar.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.code === "Tab") {
                // Focus moves to the next element.
                // Cannot use blur events as that would trigger when the user clicks into the datalist.
                this.blur();
            } else if (e.code == "Enter" || e.code == "NumpadEnter") {
                this.selectActive();
            }
        });

        this.datalist.addEventListener("selected-option", ((event: SelectedEvent) => {
            this.close();
            if (event.text !== this.searchBar.value) {
                this.searchBar.value = event.text;
                this.error = "";
                this.updated();
            }
        }) as EventListener);
        this.datalist.addEventListener("blur", this.blur.bind(this));

        this.closeListener = (e: PointerEvent) => {
            if (!e.composedPath().includes(container)) {
                if (
                    this.datalist.style.display !== "none" ||
                    document.activeElement === this.searchBar
                ) {
                    this.blur();
                }
            }
        };
        document.addEventListener("click", this.closeListener);

        this.addValidationListener(this.searchBar);
    }

    destroy() {
        document.removeEventListener("click", this.closeListener);
    }

    /** Override to provide the actual input field's id. */
    get id(): string {
        return this.searchBar.id;
    }

    get value(): string | null {
        return this.getSelected()?.value || null;
    }

    setSilent(value: string | null) {
        deselectAll(this.datalist);
        for (const option of this.datalist.options) {
            if (option.value == value) {
                option.selected = true;
                option.classList.add("cean-selected");
                this.searchBar.value = option.textContent;
                this.error = "";
                filterOptions(value, this.datalist);
                this.validate();
                return;
            }
        }

        this.searchBar.value = value ?? "";
        for (const option of this.datalist.options) {
            option.style.display = "block";
        }
        if (this.searchBar.value.length > 0) {
            this.clearButton.style.display = "inline-block";
        } else {
            this.clearButton.style.display = "none";
        }
        this.error = value === null || value === "" ? "" : "Value not recognized";
        this.validate();
    }

    updated(userTriggered: boolean = true) {
        if (this.searchBar.value.length > 0) {
            this.clearButton.style.display = "inline-block";
        } else {
            this.clearButton.style.display = "none";
        }

        super.updated(userTriggered);
    }

    get options(): HTMLCollectionOf<HTMLOptionElement> {
        return this.datalist.options;
    }

    validate() {
        // Override base class validate because baseInputElement does not
        // support validation. So build it around searchBar instead.
        this.searchBar.setCustomValidity(this.error);
        if (!this.searchBar.validity.valid) {
            this.statusElement.textContent = this.searchBar.validationMessage;
        } else {
            this.statusElement.textContent = "";
        }
    }

    private getActive(): HTMLOptionElement | null {
        for (const option of this.datalist.options) {
            if (option.classList.contains("cean-active")) {
                return option;
            }
        }
        return null;
    }

    private getSelected(): HTMLOptionElement | null {
        for (const option of this.datalist.options) {
            if (option.selected) {
                return option;
            }
        }
        return null;
    }

    private findExactTextMatch(text: string): HTMLOptionElement | null {
        const normalized = text.trim();
        for (const option of this.datalist.options) {
            if (option.textContent.trim() === normalized) {
                return option;
            }
        }
        return null;
    }

    private selectActive() {
        const active = this.getActive();
        if (active !== null) {
            this.close();
            this.error = "";
            this.setSignaling(active.value);
            this.validate();
        }
        // else: do nothing, keep dropdown open
    }

    private blur() {
        this.close();
        const selected = this.getSelected();
        const text = this.searchBar.value.trim();
        if (!text) {
            // no search, remove selection
            deselectAll(this.datalist);
            this.searchBar.value = "";
            this.error = "";
            if (selected !== null) this.updated();
        } else if (selected !== null && this.searchBar.value === selected.textContent) {
            // valid search, keep selection
            this.error = "";
        } else {
            const match = this.findExactTextMatch(text);
            if (match !== null) {
                deselectAll(this.datalist);
                match.selected = true;
                match.classList.add("cean-selected");
                this.searchBar.value = match.textContent;
                this.error = "";
                this.updated();
            } else {
                deselectAll(this.datalist);
                this.error = "Value not recognized";
            }
        }
        // else: do nothing, keep current selection
        this.validate();
    }

    private open() {
        this.datalist.style.display = "block";
        // TODO disable filter based on options
        filterOptions(this.searchBar.value, this.datalist);
    }

    private close() {
        this.datalist.style.display = "none";
    }
}

function selectActive(datalist: HTMLDataListElement, index: number | null) {
    removeActive(datalist);
    if (index === null) return;
    const opt = datalist.options[index];
    if (!opt) return;
    // opt.scrollIntoView(false); // TODO scrolls whole page, not popover
    opt.classList.add("cean-active");
}

function removeActive(datalist: HTMLDataListElement) {
    for (const opt of datalist.options) {
        opt.classList.remove("cean-active");
    }
}

function defaultRenderChoice(choice: Choice): HTMLElement {
    const key = document.createElement("span");
    key.className = "cean-item-key";
    key.textContent = choice.key;
    const label = document.createElement("span");
    label.className = "cean-item-text";
    label.textContent = choice.text;

    const wrap = document.createElement("div");
    wrap.append(key, label);
    return wrap;
}

function createSearchBar(
    key: string,
    datalist: HTMLDataListElement,
    openCombobox: () => void,
    closeCombobox: () => void,
): HTMLInputElement {
    const searchBar = document.createElement("input");
    searchBar.id = crypto.randomUUID();
    searchBar.name = key;
    searchBar.type = "text";
    searchBar.role = "combobox";
    searchBar.autocomplete = "off";
    searchBar.placeholder = "Select ...";
    searchBar.className = "cean-input";

    let currentFocus: number | null = null;
    searchBar.addEventListener("input", () => {
        openCombobox(); // This filters and ensures that the list is visible
        currentFocus = firstVisibleOption(datalist);
        selectActive(datalist, currentFocus);
    });
    searchBar.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "ArrowUp") {
            event.preventDefault();
            currentFocus = findPreviousOption(datalist, currentFocus);
            selectActive(datalist, currentFocus);
        } else if (event.code === "ArrowDown") {
            event.preventDefault();
            currentFocus = findNextOption(datalist, currentFocus);
            selectActive(datalist, currentFocus);
        } else if (event.code === "Enter" || event.code === "NumpadEnter") {
            event.preventDefault();
            event.stopPropagation();
            if (currentFocus !== null) datalist.options[currentFocus].click();
        } else if (event.code === "Escape") {
            closeCombobox();
        }
    });

    return searchBar;
}

function firstVisibleOption(datalist: HTMLDataListElement): number | null {
    for (let i = 0; i < datalist.options.length; ++i) {
        if (datalist.options[i].style.display !== "none") {
            return i;
        }
    }
    return null;
}

function createDatalist(
    choices: Choice[],
    renderChoice?: (choice: Choice) => HTMLElement,
): HTMLDataListElement {
    if (renderChoice === undefined) renderChoice = defaultRenderChoice;

    const datalist = document.createElement("datalist");
    datalist.id = crypto.randomUUID();
    datalist.role = "listbox";
    datalist.tabIndex = -1;
    datalist.style.display = "none";

    for (const choice of choices) {
        const option = document.createElement("option");
        option.value = choice.key;
        option.appendChild(renderChoice(choice));
        datalist.appendChild(option);

        option.addEventListener("click", () => {
            deselectAll(datalist);
            option.selected = true;
            option.classList.add("cean-selected");
            datalist.dispatchEvent(
                new SelectedEvent(option.value, option.textContent, { bubbles: true }),
            );
        });
    }

    return datalist;
}

function deselectAll(datalist: HTMLDataListElement) {
    for (const option of datalist.options) {
        option.selected = false;
        option.classList.remove("cean-selected");
    }
}

function findNextOption(
    datalist: HTMLDataListElement,
    start: number | null,
): number | null {
    const len = datalist.options.length;
    if (len === 0) return null;

    const end = start === null ? len - 1 : start;
    for (
        let index = start === null ? 0 : (start + 1) % len;
        index !== end;
        index = (index + 1) % len
    ) {
        if (datalist.options[index].style.display !== "none") return index;
    }
    return null;
}

function findPreviousOption(
    datalist: HTMLDataListElement,
    start: number | null,
): number | null {
    const len = datalist.options.length;
    if (len === 0) return null;

    const end = start === null ? 0 : start;
    for (
        let index = start === null ? len - 1 : (start - 1 + len) % len;
        index !== end;
        index = (index - 1 + len) % len
    ) {
        if (datalist.options[index].style.display !== "none") return index;
    }
    return null;
}

function filterOptions(filter: string, datalist: HTMLDataListElement) {
    const text = filter.toLowerCase();
    let nVisible = 0;
    for (const option of datalist.options) {
        if (option.textContent.toLowerCase().indexOf(text) > -1) {
            option.style.display = "block";
            nVisible++;
        } else {
            option.style.display = "none";
        }
    }

    if (nVisible === 1) {
        // findNextOption will iterate until it finds the one active element
        selectActive(datalist, findNextOption(datalist, 0));
    } else {
        removeActive(datalist);
    }
}

export class SelectedEvent extends Event {
    readonly key: string;
    readonly text: string;

    constructor(key: string, text: string, options?: EventInit) {
        super("selected-option", options);
        this.key = key;
        this.text = text;
    }
}

function createSearchInsert(
    searchBar: HTMLInputElement,
    clearCallback: () => void,
): [HTMLElement, HTMLButtonElement] {
    const clearButton = createClearButton(searchBar, clearCallback);

    const wrap = document.createElement("div");
    wrap.classList = "cean-input-insert";
    wrap.append(clearButton, createChevron(searchBar));
    return [wrap, clearButton];
}

function createClearButton(
    searchBar: HTMLInputElement,
    callback: () => void,
): HTMLButtonElement {
    const button = iconButton("times-circle", callback);
    button.tabIndex = -1;
    button.title = "Clear input";
    button.style.display = "none";

    searchBar.addEventListener("input", () => {
        if (searchBar.value.length > 0) {
            button.style.display = "inline-block";
        } else {
            button.style.display = "none";
        }
    });

    return button;
}

function createChevron(searchBar: HTMLInputElement): HTMLElement {
    const button = iconButton("chevron-down", () => {
        searchBar.focus();
    });
    button.tabIndex = -1;
    return button;
}
