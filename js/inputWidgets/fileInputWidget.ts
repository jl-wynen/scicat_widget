import type { AnyModel } from "@anywidget/types";
import { humanSize } from "../widgets/output.ts";
import { InputWidget } from "./inputWidget.ts";
import { iconTextButton } from "../widgets/button.ts";
import { StringInputWidget } from "./stringInputWidget.ts";

export class FileInputWidget extends InputWidget<string> {
    private stringInput: StringInputWidget;
    private model: AnyModel<object>;
    private readonly responseHandler: (message: any) => void;

    private debounceTimer: number | null = null;
    private previousValue: string | null = null;
    private validationResult: string | null = null;

    private size_: number | null = null;
    private creationTime_: Date | null = null;

    constructor(key: string, model: AnyModel<object>) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("cean-file-input");

        const stringInput = new StringInputWidget(`${key}_string`, {
            validator: (value: string) => {
                // The validation result gets stored asynchronously,
                // we only read it here so the string input is simpler.
                return this.checkValidation(value);
            },
        });
        stringInput.container.addEventListener("input", () => {
            this.callDebouncedAfter(() => {
                this.inspectFile();
            }, 500);
        });
        wrapper.appendChild(stringInput.container);

        wrapper.appendChild(
            iconTextButton(
                "folder-open",
                "Browse",
                () => {
                    model.send({
                        type: "req:browse-files",
                        payload: {
                            key, // To identify responses for this input element.
                        },
                    });
                },
                "Browse files",
            ),
        );

        super(key, wrapper);
        this.stringInput = stringInput;
        this.model = model;

        this.responseHandler = (message: any) => {
            if (message.payload?.key !== this.key) return;
            const payload = message.payload;
            switch (message.type) {
                case "res:inspect-file":
                    this.applyInspectionResult(payload as InspectionResult);
                    break;
                case "res:browse-files":
                    this.applSelectedFile(payload as BrowseResult);
                    break;
            }
        };
        model.on("msg:custom", this.responseHandler);
    }

    destroy() {
        this.model.off("msg:custom", this.responseHandler);
    }

    get value(): string | null {
        return this.stringInput.value;
    }

    set value(v: string | null) {
        this.stringInput.value = v;
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

    /** Update this and the contained string input. */
    private updated_(): void {
        this.stringInput.updated();
        this.updated();
    }

    private inspectFile() {
        const value = this.value;
        if (value === null) {
            this.previousValue = null;
            this.validationResult = null;
            this.size_ = null;
            this.creationTime_ = null;
            this.statusElement.replaceChildren();
            this.updated_();
        } else if (value !== this.previousValue) {
            this.model.send({
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
            this.statusElement.replaceChildren();
        }
        this.updated_();
        this.container.dispatchEvent(
            new CustomEvent("file-inspected", {
                bubbles: false,
                detail: { payload: result },
            }),
        );
    }

    private applSelectedFile(result: BrowseResult) {
        this.value = result.selected;
        this.inspectFile();
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

type BrowseResult = {
    key: string;
    selected: string;
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
