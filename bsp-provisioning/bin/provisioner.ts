import * as fs from "fs";
import {
    NepInfo,
    ProvisioningClient,
    SecurityClient,
    SiteClient,
} from "../src";
import { getRoot } from "../src/etc";
import { Address, Coordinates } from "../src/site";

const SECRET_FILE = `${getRoot()}/secret.json`;
const INPUT_FILE = `${getRoot()}/bin/input/provisioner-input.json`;
const OUTPUT_FILE = `${getRoot()}/bin/output/provisioner-output.json`;

interface InputFile {
    sites: Array<{
        siteName: string;
        euName?: string;
        userName?: string;
        coordinates?: Coordinates;
        address?: Address;
        status?: "ACTIVE" | "INACTIVE";
    }>;
}

interface OutputFile {
    sites: {
        [siteName: string]: {
            siteId?: string;
            euName?: string;
            euId?: string;
            userName?: string;
            userNameCanonical?: string;
            coordinates?: Coordinates;
            address?: Address;
            status?: "ACTIVE" | "INACTIVE";
        };
    };
}

async function main(): Promise<void> {
    const secret = JSON.parse(fs.readFileSync(SECRET_FILE, "utf-8"));
    const inputFile: InputFile = JSON.parse(
        fs.readFileSync(INPUT_FILE, "utf-8")
    );
    let outputFile: OutputFile = { sites: {} };
    if (fs.existsSync(OUTPUT_FILE)) {
        outputFile = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    }
    fs.mkdirSync(`${getRoot()}/bin/output/provisioner-keys`, { recursive: true });

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

    let groupExists = false;
    for await (const _ of securityClient.getGroups("SiteControllerUsers")) {
        groupExists = true;
        break;
    }

    if (!groupExists) {
        const createGroupRes = await securityClient.createGroup(
            "SiteControllerUsers",
            "Group to which site controller technical users should be assigned."
        );
        console.log(
            `\nResponse to createGroup =\n${JSON.stringify(
                createGroupRes.data
            )}`
        );
    }

    for (const site of inputFile.sites) {
        console.log(`Processing site "${site.siteName}"`);
        site.siteName = site.siteName
            .replace(/\s+/g, "-")
            .toLowerCase();
        if (site.euName === undefined) {
            site.euName = site.siteName;
        }
        site.euName = site.euName
            .replace(/\s+/g, "-")
            .toLowerCase();
        if (site.userName === undefined) {
            site.userName = site.siteName;
        }
        site.userName = site.userName
            .replace(/\s+/g, "-")
            .toLowerCase();
        if (site.coordinates === undefined) {
            site.coordinates = {
                latitude: 0,
                longitude: 0,
            };
        }
        if (site.status === undefined) {
            site.status = "ACTIVE";
        }

        if (outputFile.sites[site.siteName] === undefined) {
            outputFile.sites[site.siteName] = {
                euName: site.euName,
                userName: site.userName,
                coordinates: site.coordinates,
                address: site.address,
                status: site.status,
            };
        }

        try {
            if (outputFile.sites[site.siteName].siteId === undefined) {
                console.log("  creating site");
                const createSiteRes = await siteClient.createSite(
                    site.siteName,
                    site.euName,
                    "Auto-generated site",
                    site.coordinates,
                    site.status,
                    site.address
                );
                outputFile.sites[site.siteName].siteId = createSiteRes.data.id;
                outputFile.sites[site.siteName].status = "ACTIVE";
                fs.writeFileSync(
                    OUTPUT_FILE,
                    JSON.stringify(outputFile, null, 2)
                );
            }

            const updateStatus =
                site.status !== outputFile.sites[site.siteName].status;
            const updateCoordinates =
                JSON.stringify(site.coordinates) !==
                JSON.stringify(outputFile.sites[site.siteName].coordinates);
            const updateAddress =
                JSON.stringify(site.address) !==
                JSON.stringify(outputFile.sites[site.siteName].address);
            if (updateStatus || updateCoordinates || updateAddress) {
                console.log(
                    `  updating site (status: ${updateStatus}, coordinates: ${updateCoordinates}, address: ${updateAddress})`
                );
                await siteClient.updateSite(
                    outputFile.sites[site.siteName].siteId!,
                    site.siteName,
                    site.coordinates,
                    site.status,
                    site.address
                );
                outputFile.sites[site.siteName].status = site.status;
                outputFile.sites[site.siteName].coordinates = site.coordinates;
                outputFile.sites[site.siteName].address = site.address;
                fs.writeFileSync(
                    OUTPUT_FILE,
                    JSON.stringify(outputFile, null, 2)
                );
            }

            if (outputFile.sites[site.siteName].euId === undefined) {
                console.log("  creating enterprise unit");
                const getEuRes = await provisioningClient.getEnterpriseUnits(
                    site.euName
                );
                outputFile.sites[site.siteName].euId =
                    getEuRes.data.pageContent[0].enterpriseUnitId;
                fs.writeFileSync(
                    OUTPUT_FILE,
                    JSON.stringify(outputFile, null, 2)
                );
            }

            if (
                outputFile.sites[site.siteName].userNameCanonical === undefined
            ) {
                console.log("  creating user");
                const normalizedUserName = site.userName
                    .replace(/\s+/g, "-")
                    .toLowerCase();
                const createUserRes = await provisioningClient.createUser(
                    normalizedUserName,
                    "ACTIVE"
                );
                outputFile.sites[site.siteName].userNameCanonical =
                    createUserRes.data.username;
                fs.writeFileSync(
                    OUTPUT_FILE,
                    JSON.stringify(outputFile, null, 2)
                );
            }

            const userNameCanonical = outputFile.sites[site.siteName]
                .userNameCanonical!;

            const keyFile = `${getRoot()}/bin/output/provisioner-keys/${
                site.siteName
            }.json`;
            if (!fs.existsSync(keyFile)) {
                console.log("  setting permissions");
                await securityClient.addUsersToGroup("SiteControllerUsers", [
                    { username: userNameCanonical },
                ]);
                await provisioningClient.grantEnterpriseUnitToUser(
                    outputFile.sites[site.siteName].euId!,
                    userNameCanonical
                );

                console.log("  creating keys");
                const createKeyRes = await securityClient.createSecurityAccessKey(
                    userNameCanonical
                );
                const sharedKey = createKeyRes.data.sharedKey;
                const secretKey = createKeyRes.data.secretKey;
                fs.writeFileSync(
                    keyFile,
                    JSON.stringify(
                        {
                            ...outputFile.sites[site.siteName],
                            sharedKey,
                            secretKey,
                        },
                        null,
                        2
                    )
                );
            }
        } catch (error) {
            console.log(JSON.stringify(error.response.data, null, 2));
            throw error;
        }
    }
}

main();
