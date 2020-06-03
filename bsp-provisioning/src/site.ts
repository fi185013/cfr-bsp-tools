import { AxiosResponse } from "axios";
import { NepInfo } from ".";
import { sendRequest, ServerInfo } from "./etc";

export interface Address {
    city: string;
    country: string;
    postalCode: string;
    state: string;
    street: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

/**
 * HTTP client for the site service.
 */
export class SiteClient {
    private server: ServerInfo;

    constructor(
        public host: string,
        public port: number | null,
        public nepInfo: NepInfo,
        private ssl: boolean = true,
    ) {
        this.server = { host: this.host, port: this.port, ssl: this.ssl, nep: this.nepInfo };
    }

    createSite<T = { id: string }>(
        siteName: string,
        enterpriseUnitName: string,
        description: string,
        coordinates: Coordinates = { latitude: 0.0, longitude: 0.0 },
        status: "ACTIVE" | "INACTIVE" = "ACTIVE",
        address?: Address,
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            "site/sites",
            "POST",
            {
                siteName,
                enterpriseUnitName,
                locked: false,
                description,
                coordinates,
                status,
                address,
            },
            { "Content-Type": "application/json" },
        );
    }

    updateSite<T = any>(
        siteId: string,
        siteName: string,
        coordinates: { latitude: number, longitude: number } = { latitude: 0.0, longitude: 0.0 },
        status: "ACTIVE" | "INACTIVE" = "ACTIVE",
        address?: Address,
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            `site/sites/${siteId}`,
            "PATCH",
            {
                siteName,
                locked: false,
                coordinates,
                status,
                address,
            },
            { "Content-Type": "application/json" },
        );
    }

    async *getSites<T = any>(): AsyncIterable<object> {
        let page = 0;
        while (true) {
            const res = await sendRequest<{ lastPage: boolean; pageContent: Array<object> }>(
                this.server,
                `site/sites/find-by-criteria?pageNumber=${page}`,
                "POST",
                { criteria: { siteName: "*" },  },
                { "Content-Type": "application/json" },
            );
            for (const item of res.data.pageContent) {
                yield item;
            }
            if (res.data.lastPage) {
                break;
            }
            page++;
        }
    }
}
