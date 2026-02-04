import { AnyModel } from "@anywidget/types";

export type ReqInspectFilePayload = {
    filename: string;
};

export type ResInspectFilePayload = {
    success: boolean;
    size?: number;
    creationTime?: string;
    error?: string;
};

export type ReqBrowseFiles = {};

export type ResBrowseFiles = {
    selected: string;
};

export type ReqUploadDataset = Record<string, any>;

export type FieldError = {
    field: string;
    error: string;
};

export type ResUploadDataset = {
    errors?: FieldError[];
};

export class BackendComm {
    private readonly model: AnyModel<any>;
    private callbacks = new Map<string, Map<string, (payload: any) => void>>();

    constructor(model: AnyModel<any>) {
        this.model = model;

        this.model.on("msg:custom", (message: any) => {
            if (message.hasOwnProperty("type")) {
                const key = message["key"] as string;
                const callback = this.callbacks.get(message["type"])?.get(key);
                if (callback) {
                    callback(message["payload"]);
                }
                return;
            }
            console.warn(`Unknown message type: ${message}`);
        });
    }

    sendReqInspectFile(key: string, payload: ReqInspectFilePayload) {
        this.model.send({ type: "req:inspect-file", key, payload });
    }

    onResInspectFile(key: string, callback: (payload: ResInspectFilePayload) => void) {
        this.getForMethod("res:inspect-file").set(key, callback);
    }

    offResInspectFile(key: string) {
        this.getForMethod("res:inspect-file").delete(key);
    }

    sendReqBrowseFiles(key: string, payload: ReqBrowseFiles) {
        this.model.send({ type: "req:browse-files", key, payload });
    }

    onResBrowseFiles(key: string, callback: (payload: ResBrowseFiles) => void) {
        this.getForMethod("res:browse-files").set(key, callback);
    }

    offResBrowseFiles(key: string) {
        this.getForMethod("res:browse-files").delete(key);
    }

    sendReqUploadDataset(key: string, payload: ReqUploadDataset) {
        this.model.send({ type: "req:upload-dataset", key, payload });
    }

    onResUploadDataset(key: string, callback: (payload: ResBrowseFiles) => void) {
        this.getForMethod("res:upload-dataset").set(key, callback);
    }

    private getForMethod(method: string) {
        const map = this.callbacks.get(method);
        if (map !== undefined) {
            return map;
        }
        const newMap = new Map();
        this.callbacks.set(method, newMap);
        return newMap;
    }
}
