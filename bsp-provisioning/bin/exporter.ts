import * as fs from "fs";
import { NepInfo, ProvisioningClient, SecurityClient, SiteClient } from "../src";
import { getRoot } from "../src/etc";

const SECRET_FILE = `${getRoot()}/secret.json`;

async function main(): Promise<void> {
    const secret = JSON.parse(fs.readFileSync(SECRET_FILE, "utf-8"));

    const host = secret.default.host;
    const port = secret.default.port;
    const nep: NepInfo = {
        appKey: secret.default.appKey,
        secretKey: secret.default.secretKey,
        sharedKey: secret.default.sharedKey,
        organization: secret.default.organization,
    };

    const provisioningClient = new ProvisioningClient(host, port, nep);
    const securityClient = new SecurityClient(host, port, nep);
    const siteClient = new SiteClient(host, port, nep);

    let sites = [];
    for await (const site of siteClient.getSites()) {
        sites.push(site);
    }
    fs.writeFileSync(`${getRoot()}/bin/output/exported-sites.json`, JSON.stringify(sites, null, 2));

    let users = [];
    for await (const user of provisioningClient.getUsers()) {
        users.push(user);
    }
    fs.writeFileSync(`${getRoot()}/bin/output/exported-users.json`, JSON.stringify(users, null, 2));

    let groups = [];
    for await (const group of securityClient.getGroups()) {
        groups.push(group);
    }
    fs.writeFileSync(`${getRoot()}/bin/output/exported-groups.json`, JSON.stringify(groups, null, 2));

    const groupMembers: { [key: string]: any } = {};
    for (const group of groups) {
        let groupMembersRes = await securityClient.getGroupMembers(group.groupName);
        groupMembers[group.groupName] = groupMembersRes.data.members;
    }
    fs.writeFileSync(`${getRoot()}/bin/output/exported-group-members.json`, JSON.stringify(groupMembers, null, 2));

    const groupRoles: { [key: string]: { granted: any, effective: any } } = {};
    for (const group of groups) {
        try {
            let effectiveRes = await provisioningClient.getEffectiveRoles(group.groupName);
            let grantedRes = await provisioningClient.getGrantedRoles(group.groupName);
            groupRoles[group.groupName] = {
                effective: effectiveRes.data.pageContent,
                granted: grantedRes.data.pageContent,
            };
        } catch (error) {
            if (error.response?.status === 403) {
                console.error("\nSkipping group role export because you do not have viewing permission.\n");
                break;
            }
        }
    }
    fs.writeFileSync(`${getRoot()}/bin/output/exported-group-roles.json`, JSON.stringify(groupRoles, null, 2));
}

main();
