import * as fs from "fs";
import { getRoot } from "../src/etc";

class RowItem {
    value: string;
    count: number;
    constructor(value: string, count: number) {
        this.value = value;
        this.count = count;
    }
}

interface Verification {
    sites: boolean;
    sitesCount: number;
    users: boolean;
    usersCount: number;
}

function main(): void {
    let verified: Verification = {
        sites: false,
        sitesCount: 0,
        users: false,
        usersCount: 0,
    };
    const INPUT_FILE = `${getRoot()}/bin/provisioner-input.json`;
    const OUTPUT_FILE = `${getRoot()}/bin/provisioner-output.json`;
    if (fs.existsSync(INPUT_FILE) && fs.existsSync(OUTPUT_FILE)) {
        const inputFileData = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
        const outputFileData = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
        verified = compareInputOutputData(inputFileData, outputFileData);
        displayResultsTable(verified);
    } else {
        throw Error("Error: Input or output file issue.");
    }
}

async function displayResultsTable(verified: Verification): Promise<void> {
    let rows: any = {};
    rows["Sites Verified"] = new RowItem(
        verified.sites.toString().toUpperCase(),
        verified.sitesCount
    );
    rows["Users Verified"] = new RowItem(
        verified.users.toString().toUpperCase(),
        verified.usersCount
    );
    console.table(rows, ["value", "count"]);
}

function compareInputOutputData(
    inputFileData: { sites: any },
    outputFileData: { sites: any }
): Verification {
    let sitesVerified = false,
        usersVerified = false;
    let validSitesCount = 0,
        validUsersCount = 0;
    try {
        const inputSitesList = inputFileData.sites;
        const outputSitesList = outputFileData.sites;
        // ITERATING THROUGH INPUT SITES' LIST
        inputSitesList.forEach((site: any) => {
            let inputSiteName = null;
            let inputEu = null;
            let inputUserName = null;
            if (site.siteName) {
                inputSiteName = site.siteName.replace(/\s+/g, "-").toLowerCase();
            }
            if (site.euName) {
                inputEu = site.euName.replace(/\s+/g, "-").toLowerCase();
            }
            if (site.userName) {
                inputUserName = site.userName.replace(/\s+/g, "-").toLowerCase();
            } else {
                inputUserName = inputSiteName;
            }
            // ITERATING THROUGH OUTPUT SITES' LIST
            for (const key in outputSitesList) {
                if (outputSitesList.hasOwnProperty(key)) {
                    const entry = outputSitesList[key];
                    let outputSiteName = key.replace(/\s+/g, "-").toLowerCase();
                    if (entry.userName) {
                        const usersVerification = verifyUserNames(
                            inputUserName,
                            entry.userName,
                            validUsersCount
                        );
                        usersVerified = usersVerification.sites;
                        validUsersCount = usersVerification.count;
                    }
                    if (entry.euName) {
                        let outputEu = entry.euName.replace(/\s+/g, "-").toLowerCase();
                        if ( inputSiteName === outputSiteName || inputEu === outputEu ) {
                            const attribs = [
                                "userName",
                                "siteId",
                                "euId",
                                "status",
                                "userNameCanonical",
                            ];
                            for (let index of attribs) {
                                if (!entry[index]) {
                                    sitesVerified = false;
                                    console.log(outputSiteName + "(" + outputEu + ")" + " missing " + index);
                                    console.error(index);
                                } else {
                                    sitesVerified = true;
                                }
                            }
                            if (sitesVerified) { validSitesCount += 1;}
                        }
                    } else {
                        console.log("entry = ", entry);
                        console.error("ERROR! \nOutput entry missing entry.euName = ", entry.euName);
                    }
                }
            }
        });
        return {
            sites: sitesVerified,
            sitesCount: validSitesCount,
            users: usersVerified,
            usersCount: validUsersCount,
        };
    } catch (error) {
        console.log(error);
        throw Error("ERROR: try/catch compareInputOutputData inputFileData,outputFileData.");
    }
}

function verifyUserNames(
    inputUserName: string,
    entryUserName: string,
    countNamesVerified: number
): { sites: boolean; count: number } {
    if (inputUserName === entryUserName) {
        countNamesVerified = countNamesVerified + 1;
    } else {
        return { sites: false, count: countNamesVerified };
    }
    return { sites: true, count: countNamesVerified };
}

main();
