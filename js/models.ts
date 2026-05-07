import { FileType } from "./components/labIcon.ts";

export type Attachment = {
    localPath: string;
    caption: string;
};

export type File = {
    localPath: string;
    type: FileType;
    size?: number;
    remotePath?: string;
};

export type Instrument = {
    id: string;
    name: string;
    uniqueName: string;
};

export type Person = {
    name: string;
    email?: string;
    orcid?: string;
};

export type Proposal = {
    id: string;
    title: string;
    instrumentIds: string[];
    piName: string | null;
    piEmail: string | null;
};

export type Technique = {
    id: string;
    name: string;
};

export type Techniques = {
    prefix: string;
    techniques: Technique[];
};

export type StaticData = {
    instruments: Instrument[];
    proposals: Proposal[];
    accessGroups: string[];
    techniques: Techniques;
};
