import { InputWidget } from "./inputWidget";
import { createFormElement } from "../forms";

type Choice = {
    key: string;
    data: any;
};

export class ChoiceInputWidget extends InputWidget<string> {
    element: HTMLElement;
    chosen: string;

    constructor(choices: Array<Choice>, renderChoice: (choice: Choice) => HTMLElement) {
        super();

        const element = createFormElement("div");
        element.classList.add("cean-choice-input");

        const underlying = renderUnderlyingSelect(choices);
        element.appendChild(underlying);
        const custom = this.renderCustomChoices(choices, renderChoice, underlying);
        element.appendChild(custom);

        // TODO
        // element.addEventListener("blur", () => this.emitUpdated(), true);
        // element.addEventListener("keydown", (e) => {
        //     if ((e as KeyboardEvent).key === "Enter") this.emitUpdated();
        // });

        this.element = element;
    }

    get value(): string | null {
        // TODO
    }

    set value(v: string | null) {
        // TODO
    }

    private renderCustomChoices(
        choices: Array<Choice>,
        renderChoice: (choice: Choice) => HTMLElement,
        underlying_select: HTMLSelectElement,
    ): HTMLElement {
        const dropdown = document.createElement("div");
        dropdown.classList.add("cean-choice-dropdown");

        const search = document.createElement("input");
        search.placeholder = "Search...";
        search.type = "text";
        search.classList.add("cean-choice-search");
        dropdown.appendChild(search);

        const list = document.createElement("div");
        list.classList.add("cean-choice-list");
        search.addEventListener("click", () => {
            openDropdown(list);
        });
        dropdown.appendChild(list);

        for (const choice of choices) {
            const item = document.createElement("div");
            item.dataset.value = choice.key;
            item.appendChild(renderChoice(choice));
            item.classList.add("cean-choice-item");
            item.addEventListener("click", () => {
                this.setFromList(item, search, underlying_select, list);
            });
            list.appendChild(item);
        }

        search.addEventListener("input", () => {
            filterItems(search, list);
        });
        search.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                // do not submit the form (we are not talking to an actual server)
                e.preventDefault();
            }
        });

        document.addEventListener("click", (e) => {
            closeIfClickedOutside(dropdown, list, e);
        });

        return dropdown;
    }

    private setFromList(
        item: HTMLDivElement,
        search: HTMLInputElement,
        underlying_select: HTMLSelectElement,
        list: HTMLDivElement,
    ) {
        underlying_select.value = item.dataset.value as string;
        search.value = item.textContent;
        this.chosen = item.dataset.value as string;

        list.style.display = "none";
        filterItems(search, list);
        item.classList.add("cean-selected");
    }
}

/**
 * Create a <select> element with the provided choices.
 * This serves as a fallback in case the custom-rendered element is broken.
 * It also helps accessibility tools understand what this element is for.
 */
function renderUnderlyingSelect(choices: Array<Choice>): HTMLSelectElement {
    const select = document.createElement("select");
    choices.forEach((choice) => {
        const item = document.createElement("option");
        item.value = choice.key;
        // This is faster than properly rendering the choice and should be good
        // enough because this is only a fallback.
        item.textContent = choice.key;
        select.appendChild(item);
    });
    select.style.display = "none";
    return select;
}

function openDropdown(list: HTMLElement) {
    list.style.display = "block";
}

function closeIfClickedOutside(
    dropdown: HTMLElement,
    list: HTMLElement,
    event: PointerEvent,
) {
    const target = event.target as HTMLElement;
    if (
        target.closest(".cean-choice-dropdown") === null &&
        target !== dropdown &&
        list.offsetParent !== null
    ) {
        list.style.display = "none";
    }
}

function filterItems(search: HTMLInputElement, list: HTMLElement) {
    const searchString = search.value.toLowerCase();

    list.querySelectorAll("div.cean-choice-item").forEach((item: Element) => {
        const el = item as HTMLDivElement;
        if (el.textContent.toLowerCase().includes(searchString)) {
            el.style.display = "block";
        } else {
            el.style.display = "none";
        }
    });
}
