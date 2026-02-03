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
