export class Dialog {
    private readonly _dialog: HTMLDialogElement;
    private readonly _header: HTMLElement;
    private readonly _body: HTMLElement;
    private readonly _footer: HTMLElement;

    closeOnClickOutside = true;

    constructor() {
        this._header = document.createElement("header");
        this._header.className = "cean-dialog-header";
        this._header.textContent = "Confirm Upload";

        this._body = document.createElement("div");
        this._body.className = "cean-dialog-body";

        this._footer = document.createElement("footer");
        this._footer.className = "cean-dialog-footer";

        const content = document.createElement("div");
        content.append(this._header, this._body, this._footer);
        // Stop click in the dialog from closing the dialog:
        content.addEventListener("click", (e) => e.stopPropagation());

        this._dialog = document.createElement("dialog");
        this._dialog.className = "cean-modal-dialog";
        this._dialog.append(content);

        this._dialog.onclick = (event) => {
            if (this.closeOnClickOutside && event.target === this._dialog) this.close();
        };
        this._dialog.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.shiftKey) {
                e.stopPropagation();
                e.preventDefault();
            }
        });

        // Remove from DOM when closed
        this._dialog.onclose = () => {
            this._dialog.remove();
        };
    }

    get header(): HTMLElement {
        return this._header;
    }

    get body(): HTMLElement {
        return this._body;
    }

    get footer(): HTMLElement {
        return this._footer;
    }

    close() {
        this._dialog.close();
    }

    showModal() {
        // Append dialog here so it gets re-appended whenever the dialog is reopened.
        document.body.appendChild(this._dialog);
        this._dialog.showModal();
    }
}
