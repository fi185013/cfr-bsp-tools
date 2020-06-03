import crypto from "crypto";

export { ProvisioningClient } from "./provisioning";
export { SecurityClient } from "./security";
export { SiteClient } from "./site";
export { TdmClient } from "./tdm";

/**
 * Authentication information used by the BSP API.
 */
export interface NepInfo {
    appKey: string;
    secretKey: string;
    sharedKey: string;
    organization: string;
}

/**
 * Headers used by the BSP API, namely those that factor into HMAC signing.
 */
export interface BspHeaders {
    "Content-Type"?: string;
    "Content-MD5"?: string;
    "nep-application-key"?: string;
    "nep-correlation-id"?: string;
    "nep-organization"?: string;
    "nep-service-version"?: string;
}

/**
 * Create the HMAC signature for a request.
 *
 * @param secretKey - BSP secret key.
 * @param date - Date of the request.
 * @param method - HTTP method/verb of the request.
 * @param pathAndQuery - URL path and query of the request.
 *     In `http://www.httpbin.org/get?foo=bar`, this would be `/get?foo=bar`.
 * @param headers - Headers of the request.
 */
export function signBspRequest(secretKey: string, date: Date, method: string, pathAndQuery: string, headers: BspHeaders): string {
    date.setMilliseconds(0);
    const secret = secretKey + date.toISOString();
    let content = [
        method,
        pathAndQuery,
        headers["Content-Type"],
        headers["Content-MD5"],
        headers["nep-application-key"],
        headers["nep-correlation-id"],
        headers["nep-organization"],
        headers["nep-service-version"]
    ]
        .map(x => x === undefined ? x : x.trim())
        .filter(x => x !== undefined)
        .join("\n");
    return crypto.createHmac("sha512", secret).update(content).digest("base64");
}
