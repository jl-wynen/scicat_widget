import { InputComponent, InputOptions } from "./inputComponent.ts";
import { iconButton } from "../button.ts";

export type Choice = {
    key: string;
    text: string;
};

export interface Options extends InputOptions<string> {
    renderChoice?: (choice: Choice) => HTMLElement;
    allowArbitrary?: boolean;
    filter?: boolean;
}

/**
 * Input component to select text from a list of options.
 */
export class ComboboxInput extends InputComponent<string> {
    private readonly datalist: HTMLDataListElement;
    private readonly searchBar: HTMLInputElement;

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

        const container = document.createElement("div");
        container.className = "cean-combobox";
        container.append(searchBar, datalist, createChevron(searchBar));

        super(key, container, options);

        this.datalist = datalist;
        this.searchBar = searchBar;

        this.searchBar.addEventListener("focus", this.open.bind(this));
        this.searchBar.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.code === "Tab") {
                // Focus moves to the next element.
                // Cannot use blur events as that would trigger when the user clicks into the datalist.
                this.close();
            }
        });

        this.datalist.addEventListener("selected-option", ((event: SelectedEvent) => {
            this.close();
            this.searchBar.value = event.text;
        }) as EventListener);
        this.datalist.addEventListener("blur", () => {
            this.close();
        });

        this.closeListener = (e: PointerEvent) => {
            if (!e.composedPath().includes(container)) {
                this.close();
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
        for (const option of this.datalist.options) {
            if (option.selected) {
                return option.value;
            }
        }
        return null;
    }

    setSilent(value: string | null) {
        for (const option of this.datalist.options) {
            if (option.value == value) {
                option.selected = true;
                option.classList.add("cean-selected");
                this.searchBar.value = option.textContent;
                return;
            }
        }
        this.searchBar.value = value ?? "";
    }

    get options(): HTMLCollectionOf<HTMLOptionElement> {
        return this.datalist.options;
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
    // searchBar.list = ""; // TODO
    searchBar.placeholder = "Select ...";
    searchBar.className = "cean-input";

    let currentFocus: number | null = null;
    searchBar.addEventListener("input", () => {
        currentFocus = null;
        openCombobox(); // This filters and ensures that the list is visible
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

function createDatalist(
    choices: Choice[],
    renderChoice?: (choice: Choice) => HTMLElement,
): HTMLDataListElement {
    if (renderChoice === undefined) renderChoice = defaultRenderChoice;

    const datalist = document.createElement("datalist");
    datalist.id = crypto.randomUUID();
    datalist.role = "listbox";
    datalist.tabIndex = -1;

    for (const choice of choices) {
        const option = document.createElement("option");
        option.value = choice.key;
        option.appendChild(renderChoice(choice));
        datalist.appendChild(option);

        option.addEventListener("click", () => {
            for (const opt of datalist.options) {
                opt.selected = false;
                opt.classList.remove("cean-selected");
            }
            option.selected = true;
            option.classList.add("cean-selected");
            datalist.dispatchEvent(
                new SelectedEvent(option.value, option.textContent, { bubbles: true }),
            );
        });
    }

    return datalist;
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

function createChevron(searchBar: HTMLInputElement): HTMLElement {
    const button = iconButton("chevron-down", () => {
        searchBar.focus();
    });
    button.tabIndex = -1;
    return button;
}
