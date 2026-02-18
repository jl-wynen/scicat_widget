import cssContent from "./datasetUploadWidget.css";
import fieldInfos from "./fieldInfos.json";
import htmlFragment from "./widget-fragment.html";

export type FieldInfo = {
    label: string;
    description: string;
};

export function fieldInfo(key: string): FieldInfo | null {
    const infos = fieldInfos as Record<string, FieldInfo>;
    return infos[key] ?? null;
}

export const widgetTemplate = document.createElement("template");
widgetTemplate.innerHTML = htmlFragment;

export const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(cssContent);
