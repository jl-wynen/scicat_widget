import type { AnyModel } from "@anywidget/types";
import { FileInputWidget, StringInputWidget } from "./inputWidgets.ts";
import { iconButton } from "./widgets/iconButton.ts";

export class FilesWidget {
    element: HTMLDivElement;
    private model: AnyModel<object>;

    constructor(model: AnyModel<object>) {
        this.model = model;

        const element = document.createElement("div");
        element.classList.add("cean-files-widget");

        const widget = new SingleFileWidget(model);
        element.appendChild(widget.element);

        this.element = element;
    }
}

class SingleFileWidget {
    readonly key: string;
    readonly element: HTMLDivElement;
    private readonly responseHandler: (response: any) => void;

    constructor(model: AnyModel<object>) {
        this.key = crypto.randomUUID();
        this.element = document.createElement("div");
        this.element.id = this.key;
        this.element.classList.add("cean-single-file-widget");

        const input = new FileInputWidget();
        input.setKey(this.key);
        input.element.classList.add("cean-file-input");
        this.element.appendChild(input.element);

        const stats = document.createElement("div");
        stats.classList.add("cean-file-stats");
        this.element.appendChild(stats);

        this.responseHandler = (message: any) => {
            if (message.type !== "rsp:inspect-file") return;
            const payload = message.payload;
            if (payload.key !== this.key) return;

            renderFileStats(payload, input, stats);
        };
        model.on("msg:custom", this.responseHandler);

        input.element.addEventListener("input-updated", () => {
            if (input.value === null) {
                clearFileStats(input, stats);
                return;
            }
            model.send({
                type: "req:inspect-file",
                payload: {
                    filename: input.value,
                    key: this.key, // To identify responses for this input element.
                },
            });
        });
    }

    private remove(model: AnyModel<object>) {
        this.element.remove();
        model.off("msg:custom", this.responseHandler);
    }
}

function clearFileStats(input: FileInputWidget, stats: HTMLDivElement) {
    stats.replaceChildren();
}

function renderFileStats(payload: any, input: FileInputWidget, stats: HTMLDivElement) {
    if (payload.success) {
        delete input.element.dataset.error;

        const sizeLabel = document.createElement("span");
        sizeLabel.textContent = "Size:";
        const size = document.createElement("span");
        size.textContent = humanSize(payload.size);

        const createdLabel = document.createElement("span");
        createdLabel.textContent = "Created:";
        const created = document.createElement("span");
        created.textContent = new Date(payload.creationTime).toLocaleString();

        stats.replaceChildren(sizeLabel, size, createdLabel, created);
    } else {
        input.element.dataset["error"] = "true";

        const span = document.createElement("span");
        span.textContent = payload.error;
        stats.replaceChildren(span);
    }
}

function humanSize(size: number): string {
    const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    const value = (size / Math.pow(1024, i)).toFixed(2);
    const unit = ["B", "kiB", "MiB", "GiB", "TiB"][i];
    return `${value} ${unit}`;
}
