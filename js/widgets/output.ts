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
