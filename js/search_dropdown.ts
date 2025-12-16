import type {AnyModel, RenderProps} from "@anywidget/types";
import "./search_dropdown.css";

interface WidgetModel {
    options: Array<string>
}

function render({model, el}: RenderProps<WidgetModel>) {
    const container = document.createElement("div");

    const select = renderUnderlyingSelect(model);
    container.appendChild(select);

    const dropdown = renderDropdown(model, select);
    container.appendChild(dropdown);

    el.appendChild(container);
}

function renderUnderlyingSelect(model: AnyModel<WidgetModel>): HTMLSelectElement {
    const select = document.createElement("select");
    const options = model.get("options");
    if (options === undefined) {
        return select;
    }
    for (const option of options) {
        const item = document.createElement("option");
        item.value = option;
        item.textContent = option;
        select.appendChild(item);
    }
    select.style.display = "none";
    return select;
}

function renderDropdown(model: AnyModel<WidgetModel>, underlying_select: HTMLSelectElement): HTMLDivElement {
    const dropdown = document.createElement("div");
    dropdown.classList.add("cean-dropdown");

    const search = document.createElement("input");
    search.placeholder = "Search...";
    search.type = "text";
    search.classList.add("cean-dropdown-search");
    dropdown.appendChild(search);

    const list = document.createElement("div");
    list.classList.add("cean-dropdown-list");
    dropdown.appendChild(list);
    search.addEventListener("click", () => {
        openDropdown(list);
    })

    const options = model.get("options");
    if (options === undefined) {
        return dropdown;
    }
    for (const option of options) {
        const item = document.createElement("div");
        item.dataset.value = option;
        item.textContent = option;
        item.classList.add("cean-dropdown-item");
        list.appendChild(item);
        item.addEventListener("click", () => {
            setFromList(item, search, underlying_select, list);
        });
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

function openDropdown(item_list: HTMLElement) {
    item_list.style.display = "block";
}

function closeIfClickedOutside(dropdown: HTMLElement, list: HTMLElement, event: PointerEvent) {
    const target = event.target as HTMLElement;
    if (
        target.closest(".cean-dropdown") === null &&
        target !== dropdown &&
        list.offsetParent !== null
    ) {
        list.style.display = "none";
    }
}

function setFromList(item: HTMLDivElement, search: HTMLInputElement, underlying_select: HTMLSelectElement, list: HTMLDivElement) {
    underlying_select.value = item.dataset.value as string;
    search.value = item.textContent;

    list.style.display = "none";
    filterItems(search, list);
    item.classList.add("cean-selected");
}

function filterItems(search: HTMLInputElement, list: HTMLElement) {
    const searchString = search.value.toLowerCase();

    console.log("Filtering", searchString);
    list.querySelectorAll("div.cean-dropdown-item").forEach((item: Element) => {
        const el = item as HTMLDivElement;
        if (el.textContent.toLowerCase().includes(searchString)) {
            el.style.display = "block";
        } else {
            el.style.display = "none";
        }
    });
}

export default {render};
