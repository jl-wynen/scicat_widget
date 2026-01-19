export function validateEmail(email: string) {
    // TODO use proper validator
    if (email.includes("@")) return null;
    return "Needs @";
}

export function validateOrcid(orcid: string) {
    // TODO use proper validator
    return null;
}
