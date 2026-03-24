import { InputComponent, InputOptions } from "./inputComponent.ts";
import { BackendComm } from "../../comm.ts";
import { TextInput } from "./textInput.ts";
import { iconTextButton } from "../button.ts";

/**
 * Input component for a file (path).
 */
export class FileInput extends InputComponent<string> {
    private readonly textInput: TextInput;

    constructor(key: string, comm: BackendComm, options: InputOptions<string>) {
        const textInput = new TextInput(key, options);

        const browseButton = iconTextButton(
            "folder-open",
            "Browse",
            () => {},
            "Browse files",
        );

        const container = document.createElement("div");
        container.classList.add("cean-file-input");
        container.append(textInput.container, browseButton);

        super(key, container, options);
        this.textInput = textInput;

        // this.addValidationListener(this.inputElement);
    }

    get id(): string {
        return this.textInput.id;
    }

    get value(): string | null {
        // TODO
    }

    setSilent(value: string | null): void {
        // TODO
    }
}
