import { StringInputWidget } from "./inputWidgets.ts";
import { createInputWithLabel } from "./forms.ts";
import { iconButton } from "./widgets/iconButton.ts";

export class FilesWidget {
    element: HTMLDivElement;

    constructor() {
        const element = document.createElement("div");
        element.classList.add("cean-files-widget");

        const [label, input] = createInputWithLabel("File", StringInputWidget);
        element.appendChild(label);
        element.appendChild(input.element);

        element.appendChild(iconButton("trash"));

        this.element = element;
    }
}
