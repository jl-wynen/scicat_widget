import { InputComponent } from "./inputComponent.ts";

export class ComboboxInput extends InputComponent<string> {
    private readonly datalist: HTMLDataListElement;
    private readonly searchBar: HTMLInputElement;
    private readonly container: HTMLDivElement;

    constructor(rawInputElement: HTMLInputElement) {
        super(rawInputElement);

        this.datalist = createDatalist(rawInputElement.id);
        this.searchBar = this.createSearchBar(rawInputElement.id, this.datalist);
        this.container = document.createElement("div");
        this.container.className = "combobox";
        this.container.append(this.searchBar, this.datalist);

        this.searchBar.addEventListener("focus", this.open.bind(this));

        this.datalist.addEventListener("selected-option", ((event: SelectedEvent) => {
            this.close();
            this.searchBar.value = event.text;
        }) as EventListener);

        document.addEventListener("click", (e) => {
            if (!e.composedPath().includes(this.container)) {
                this.close();
            }
        });
    }

    get value(): string | null {
        for (const option of this.datalist.options) {
            if (option.selected) {
                return option.value;
            }
        }
        return null;
    }

    wrapElements(): HTMLDivElement {
        return this.wrapElementsWith(this.container);
    }

    private open() {
        this.datalist.style.display = "block";
        filterOptions(this.searchBar.value, this.datalist);
    }

    private close() {
        this.datalist.style.display = "none";
    }

    private createSearchBar(
        baseId: string,
        datalist: HTMLDataListElement,
    ): HTMLInputElement {
        const searchBar = document.createElement("input");
        searchBar.id = `${baseId}-search`;
        searchBar.name = baseId;
        searchBar.type = "text";
        searchBar.role = "combobox";
        searchBar.autocomplete = "off";
        // searchBar.list = ""; // TODO
        searchBar.placeholder = "Select ...";

        let currentFocus: number | null = null;
        searchBar.addEventListener("input", () => {
            currentFocus = null;
            this.open(); // This filters and ensures that the list is visible
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
                this.close();
            }
        });

        return searchBar;
    }
}

function selectActive(datalist: HTMLDataListElement, index: number | null) {
    removeActive(datalist);
    if (index === null) return;
    const opt = datalist.options[index];
    if (!opt) return;
    // opt.scrollIntoView(false); // TODO scrolls whole page, not popover
    opt.classList.add("active");
}

function removeActive(datalist: HTMLDataListElement) {
    for (const opt of datalist.options) {
        opt.classList.remove("active");
    }
}

function createDatalist(baseId: string): HTMLDataListElement {
    const datalist = document.createElement("datalist");
    datalist.id = `${baseId}-datalist`;
    datalist.role = "listbox";

    for (let i = 0; i < 15; ++i) {
        const option = document.createElement("option");
        option.value = i.toString();

        const key = document.createElement("span");
        key.className = "key";
        key.textContent = i.toString();
        const label = document.createElement("span");
        label.className = "label";
        label.textContent = "Option";
        option.append(key, label);

        datalist.appendChild(option);

        option.addEventListener("click", () => {
            for (const opt of datalist.options) {
                opt.selected = false;
                opt.classList.remove("selected");
            }
            option.selected = true;
            option.classList.add("selected");
            datalist.dispatchEvent(new SelectedEvent(option.value, option.textContent));
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

class SelectedEvent extends Event {
    readonly key: string;
    readonly text: string;

    constructor(key: string, text: string) {
        super("selected-option");
        this.key = key;
        this.text = text;
    }
}
