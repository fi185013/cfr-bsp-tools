import { AxiosResponse } from "axios";
import { NepInfo } from ".";
import { sendRequest, ServerInfo } from "./etc";

/**
 * HTTP client for the provisioning service.
 */
export class ProvisioningClient {
    private server: ServerInfo;

    constructor(
        public host: string,
        public port: number | null,
        public nepInfo: NepInfo,
        private ssl: boolean = true,
    ) {
        this.server = { host: this.host, port: this.port, ssl: this.ssl, nep: this.nepInfo };
    }

    async *getUsers<T = any>(usernamePattern: string = "*"): AsyncIterable<object> {
        let page = 0;
        while (true) {
            const res = await sendRequest<{ lastPage: boolean; pageContent: Array<object> }>(
                this.server,
                `provisioning/users?pageNumber=${page}&usernamePattern=${usernamePattern}`,
                "GET",
                null,
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

    createUser<T = { username: string }>(
        username: string,
        status: "ACTIVE" | "DELETED" | "INACTIVE",
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            "provisioning/users",
            "POST",
            {
                username,
                forcePasswordChange: false,
                status,
            },
            { "Content-Type": "application/json" },
        );
    }

    getEnterpriseUnits<T = { pageContent: Array<{ enterpriseUnitId: string }> }>(namePattern: string): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            `provisioning/enterprise-units?namePattern=${namePattern}`,
            "GET",
            null,
            { "Content-Type": "application/json" },
        );
    }

    getEffectiveRoles<T = { pageContent: Array<object> }>(groupName: string): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            `provisioning/role-grants/group-grants/${groupName}/effective-roles`,
            "GET",
            null,
            { "Content-Type": "application/json" },
        );
    }

    getGrantedRoles<T = { pageContent: Array<object> }>(groupName: string): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            `provisioning/role-grants/group-grants/${groupName}/granted-roles`,
            "GET",
            null,
            { "Content-Type": "application/json" },
        );
    }

    grantEnterpriseUnitToUser<T = { username: string }>(
        enterpriseUnitId: string,
        username: string,
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            "provisioning/enterprise-unit-grants",
            "POST",
            {
                enterpriseUnitId,
                username,
            },
            { "Content-Type": "application/json" },
        );
    }
}
