import { AxiosResponse } from "axios";
import { NepInfo } from ".";
import { sendRequest, ServerInfo } from "./etc";

/**
 * HTTP client for the security service.
 */
export class SecurityClient {
    private server: ServerInfo;

    constructor(
        public host: string,
        public port: number | null,
        public nepInfo: NepInfo,
        private ssl: boolean = true,
    ) {
        this.server = { host: this.host, port: this.port, ssl: this.ssl, nep: this.nepInfo };
    }

    async *getGroups<T = any>(groupNamePattern: string = "*"): AsyncIterable<{ groupName: string, description: string }> {
        let page = 0;
        while (true) {
            const res = await sendRequest<{ lastPage: boolean; pageContent: Array<{ groupName: string, description: string }> }>(
                this.server,
                `security/groups?pageNumber=${page}&groupNamePattern=${groupNamePattern}`,
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

    createGroup<T = any>(
        groupName: string,
        description: string,
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            "security/groups",
            "POST",
            {
                groupName,
                description,
            },
            { "Content-Type": "application/json" },
        );
    }

    getGroupMembers<T = { groupName: string, members: Array<{ username: string }> }>(
        groupName: string,
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            `security/group-memberships/users?groupName=${groupName}`,
            "GET",
            null,
            { "Content-Type": "application/json" },
        );
    }

    addUsersToGroup<T = any>(
        groupName: string,
        members: Array<{ username: string }>,
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            "security/group-memberships",
            "POST",
            {
                groupName,
                members,
            },
            { "Content-Type": "application/json" },
        );
    }

    createSecurityAccessKey<T = { sharedKey: string, secretKey: string }>(
        username: string,
    ): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            "security/security-access-keys",
            "POST",
            {
                userId: {
                    username,
                },
            },
            { "Content-Type": "application/json" },
        );
    }
}
