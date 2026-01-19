import isEmail from "validator/lib/isEmail";

/**
 * Function to validate input values.
 *
 * @param value The value to validate.
 * @returns An error message if the value is invalid, or `null` if it's valid.
 */
export type Validator<T> = (value: T) => string | null;

/**
 * Validate email addresses.
 *
 * @param email The string address to validate.
 * @returns An error message if the email is invalid, or `null` if it's valid.
 */
export function validateEmail(email: string): string | null {
    if (isEmail(email)) return null;
    return "Invalid email address";
}

/**
 * Validate ORCID iDs.
 *
 * Based on
 * https://support.orcid.org/hc/en-us/articles/360006897674-Structure-of-the-ORCID-Identifier
 * @param orcid The string to validate.
 * @returns Error message if the ID is invalid, or `null` if it's valid.'
 */
export function validateOrcid(orcid: string): string | null {
    return checkOrcidId(orcid);
}

const ORCID_HOST = "orcid.org";

function parseOrcidId(orcid: string): [string | null, string] | { error: string } {
    // This regex allows any URL with a slash or a string without slashes:
    const match = orcid.match(/^((https?:\/\/)?(.*)\/)?([^/]+)$/);
    if (match === null) return { error: "Invalid ORCID ID structure" };
    return [match[3] ?? null, match[4]];
}

function checkOrcidId(orcid: string): string | null {
    orcid.match(/^((https?:\/\/)?(.*))?\/.[^/]$/);

    const res = parseOrcidId(orcid);
    if (typeof res === "object" && "error" in res) {
        return res.error;
    }
    const [host, id] = res;
    if (host !== null && host !== ORCID_HOST) {
        return `Invalid ORCID host, must be '${ORCID_HOST}' or empty.`;
    }
    return checkOrcidIdStructure(id) ?? checkOrcidIdChecksum(id);
}

function checkOrcidIdStructure(id: string): string | null {
    const groups = id.split("-");
    if (groups.length !== 4) {
        return "Invalid ORCID ID: expected 4 groups separated by dashes.";
    }
    for (const group of groups) {
        if (group.length !== 4) {
            return "Invalid ORCID ID: expected 4 digits per group.";
        }
    }
    return null;
}

function checkOrcidIdChecksum(orcid: string): string | null {
    let total = 0;
    for (let i = 0; i < orcid.length - 1; i++) {
        const c = orcid[i];
        if (c === "-") continue;

        const parsed = parseInt(c);
        if (isNaN(parsed)) return `Invalid ORCID ID: expected a digit, got '${c}'.`;
        total = (total + parsed) * 2;
    }
    const result = (12 - (total % 11)) % 11;
    const checksum = result === 10 ? "X" : result.toString();

    if (checksum !== orcid[orcid.length - 1]) {
        return "Invalid ORCID ID checksum";
    }
    return null;
}
