import fieldInfos from "./assets/fieldInfos.json";

export type FieldInfo = {
    label: string;
    description: string;
};

export function fieldInfo(key: string): FieldInfo | null {
    const infos = fieldInfos as Record<string, FieldInfo>;
    return infos[key] ?? null;
}
