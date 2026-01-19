import isEmail from "validator/lib/isEmail";

export function validateEmail(email: string) {
    if (isEmail(email)) return null;
    return "Invalid email address";
}

export function validateOrcid(orcid: string) {
    // TODO use proper validator
    return null;
}
