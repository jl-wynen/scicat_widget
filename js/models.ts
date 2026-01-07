export type Person = {
    name: string;
    email?: string;
    orcid?: string;
};

export type Instrument = {
    id: string;
    name: string;
    uniqueName: string;
};

export type Proposal = {
    id: string;
    title: string;
    instrumentIds: [string];
};
