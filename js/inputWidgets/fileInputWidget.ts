import { humanSize } from "../widgets/output.ts";
import { InputWidget } from "./inputWidget.ts";
import { iconTextButton } from "../widgets/button.ts";
import { StringInputWidget } from "./stringInputWidget.ts";
import { BackendComm, ResBrowseFiles, ResInspectFilePayload } from "../comm.ts";

export class FileInputWidget extends InputWidget<string> {
    private stringInput: StringInputWidget;
    private comm: BackendComm;

    private debounceTimer: number | null = null;
    private previousValue: string | null = null;
    private validationResult: string | null = null;

    private size_: number | null = null;
    private creationTime_: Date | null = null;

    constructor(key: string, comm: BackendComm) {
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

        const browseButton = iconTextButton(
            "folder-open",
            "Browse",
            () => {
                comm.sendReqBrowseFiles(key, {});
            },
            "Browse files",
        );
        browseButton.classList.add("cean-browse-files-button");
        wrapper.appendChild(browseButton);

        comm.onResInspectFile(key, (payload) => {
            this.applyInspectionResult(payload);
        });
        comm.onResBrowseFiles(key, (payload) => {
            this.applySelectedFile(payload);
        });

        super(key, wrapper);
        this.stringInput = stringInput;
        this.comm = comm;

        // Only the <input> element should have this class, not the <div> wrapper.
        wrapper.classList.remove("cean-input");
    }

    destroy() {
        this.comm.offResInspectFile(this.key);
        this.comm.offResBrowseFiles(this.key);
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
            this.comm.sendReqInspectFile(this.key, {
                filename: value,
            });
        }
    }

    private applyInspectionResult(result: ResInspectFilePayload) {
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

    private applySelectedFile(result: ResBrowseFiles) {
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
