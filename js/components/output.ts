/** Format a size in bytes as a human-readable string. */
export function humanSize(size: number | null): HTMLSpanElement {
    const span = document.createElement("span");
    if (size === null) {
        span.innerText = "ERROR";
    } else {
        const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
        const value = (size / Math.pow(1024, i)).toFixed(2);
        const unit = ["B", "kiB", "MiB", "GiB", "TiB"][i];
        span.innerText = `${value} ${unit}`;
    }
    return span;
}

/** Create a link HTML without displaying a scheme that opens in a new tab. */
export function simpleLink(href: string): string {
    const display = href.replace(/^https?:\/\/|\/$/g, "");
    return `<a href="${href}" target=_blank>${display}</a>`;
}

/** Create a link with an image */
export function imageLink(href: string, imageHTML: string): HTMLAnchorElement {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.innerHTML = imageHTML;
    return anchor;
}

/** Create an element containing text. */
export function textElement(tag: string, text: string): HTMLElement {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
}
