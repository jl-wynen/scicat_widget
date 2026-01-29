import { StringInputWidget } from "./stringInputWidget.ts";
import type { AnyModel } from "@anywidget/types";
import { humanSize } from "../widgets/output.ts";

export class FileInputWidget extends StringInputWidget {
    private debounceTimer: number | null = null;
    private previousValue: string | null = null;
    private validationResult: string | null = null;
    private model: AnyModel<object>;
    private readonly inspectionResponseHandler: (message: any) => void;

    private size_: number | null = null;
    private creationTime_: Date | null = null;

    constructor(key: string, model: AnyModel<object>) {
        super(key, {
            validator: (value: string) => {
                return this.checkValidation(value);
            },
        });

        this.container.classList.add("cean-file-input");
        this.container.addEventListener("input", () => {
            this.callDebouncedAfter(() => {
                this.inspectFile(model);
            }, 500);
        });

        const pickerButton = document.createElement("button");
        pickerButton.textContent = "Browse";
        pickerButton.addEventListener("click", () => {
            model.send({
                type: "req:browse-files",
                payload: {
                    key: this.key, // To identify responses for this input element.
                },
            });
        });
        this.container.appendChild(pickerButton);

        this.model = model;
        this.inspectionResponseHandler = (message: any) => {
            if (message.type !== "res:inspect-file") return;
            const payload = message.payload as InspectionResult;
            if (payload.key !== this.key) return;
            this.applyInspectionResult(payload);
            this.container.dispatchEvent(
                new CustomEvent("file-inspected", {
                    bubbles: false,
                    detail: { payload },
                }),
            );
        };
        model.on("msg:custom", this.inspectionResponseHandler);
    }

    destroy() {
        this.model.off("msg:custom", this.inspectionResponseHandler);
    }

    get size(): number | null {
        return this.size_;
    }

    get creationTime(): Date | null {
        return this.creationTime_;
    }

    private checkValidation(_value: string): string | null {
        return this.validationResult;
    }

    private inspectFile(model: AnyModel<object>) {
        const value = this.value;
        if (value === null) {
            this.previousValue = null;
            this.validationResult = null;
            this.size_ = null;
            this.creationTime_ = null;
            this.statusElement.replaceChildren();
        } else if (value !== this.previousValue) {
            model.send({
                type: "req:inspect-file",
                payload: {
                    filename: value,
                    key: this.key, // To identify responses for this input element.
                },
            });
        }
    }

    private applyInspectionResult(result: InspectionResult) {
        this.validationResult = result.error ?? null;
        this.previousValue = this.value;
        if (result.success) {
            this.size_ = result.size ?? null;
            this.creationTime_ = new Date(result.creationTime ?? "");
            renderFileStats(this.statusElement, this.size_, this.creationTime_);
        } else {
            this.size_ = null;
            this.creationTime_ = null;
        }
        super.updated(); // triggers validator which checks the validationResult
    }

    private callDebouncedAfter(fn: () => void, timeout: number) {
        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = window.setTimeout(() => {
            fn();
            this.debounceTimer = null;
        }, timeout);
    }
}

type InspectionResult = {
    key: string;
    success: boolean;
    size?: number;
    creationTime?: string;
    error?: string;
};

function renderFileStats(
    parent: HTMLElement,
    size: number | null,
    creationTime: Date | null,
) {
    const sizeSpan = humanSize(size);
    // Should not be null, but that depends on the Python code sending the messages
    const dateStr = creationTime !== null ? creationTime.toLocaleString() : "ERROR";
    parent.innerHTML = `<span>Size:</span>${sizeSpan.outerHTML}<span>Creation time:</span><span>${dateStr}</span>`;
}
