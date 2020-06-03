import axios, { AxiosResponse } from "axios";
import moment from "moment";
import path from "path";
// import uuidV4 from "uuid/v4";
import { NepInfo, signBspRequest } from ".";
const {"v4": uuidv4} = require('uuid');

export type ServerInfo = { host: string, port?: number | null, ssl?: boolean, nep: NepInfo };

/**
 * Assert to the type system that the calling code is unreachable. If called,
 * will throw an error. This is mainly useful for default branches in a switch
 * so that any new variants of the switched type will cause a build error.
 *
 * ```typescript
 * let value: "a" | "b";
 * switch (value) {
 *     case "a":
 *         break;
 *     case "b":
 *        break;
 *     default:
 *         return unreachable(value);
 * }
 * ```
 *
 * @param value - A value whose possible types should have been narrowed by a
 *     switch or other condition such that no possible values remain.
 */
export function unreachable(value: never): never {
    throw new Error(`This should be unreachable; value: ${value}`);
}

/**
 * Get the directory containing the project.
 */
export function getRoot(): string {
    return path.dirname(__dirname);
}

function makeUrl(host: string, resource: string, port?: number | null, ssl?: boolean): string {
    const protocol = ssl === false || ssl === null ? "http" : "https";
    if (port === undefined || port === null) {
        return `${protocol}://${host}/${resource}`;
    } else {
        return `${protocol}://${host}:${port}/${resource}`;
    }
}

export function sendRequest<T = any>(
    server: { host: string, port?: number | null, ssl?: boolean, nep: NepInfo },
    resource: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD",
    data: string | object | null = null,
    headers: object = {},
): Promise<AxiosResponse<T>> {
    const correlationId = uuidv4();
    // const correlationId = uuidV4();
    const date = moment.utc();
    const dateString = `${date.format("ddd, DD MMM YYYY HH:mm:ss")} GMT`;
    const signedHeaders = {
        "Accept": "application/json",
        "Date": dateString,
        "nep-application-key": server.nep.appKey,
        "nep-correlation-id": correlationId,
        "nep-organization": server.nep.organization,
        // "nep-service-version": "2:2",
        ...headers,
    };
    const signature = signBspRequest(server.nep.secretKey, date.toDate(), method, "/" + resource, signedHeaders);
    const allHeaders = {
        ...signedHeaders,
        "Authorization": `AccessKey ${server.nep.sharedKey}:${signature}`,
    };

    const url = makeUrl(server.host, resource, server.port, server.ssl);
    // console.log(`${method} ${url}\n${JSON.stringify(data, null, 2)}\n\n`);
    switch (method) {
        case "GET":
            return axios.get(url, { headers: allHeaders });
        case "POST":
            return axios.post(url, data, { headers: allHeaders });
        case "PUT":
            return axios.put(url, data, { headers: allHeaders });
        case "PATCH":
            return axios.patch(url, data, { headers: allHeaders });
        case "DELETE":
            return axios.delete(url, { headers: allHeaders });
        case "HEAD":
            return axios.head(url, { headers: allHeaders });
        // istanbul ignore next
        default:
            return unreachable(method);
    }
}
