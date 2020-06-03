import { existsSync, readFileSync, writeFileSync } from "fs";
import { getRoot } from "../src/etc";
import { Address, Coordinates } from "../src/site";

import parser from "papaparse";
// import { parser } from ‘papaparse’;

const OUTPUT_FILE = `${getRoot()}/bin/input/provisioner-input.json`;
// const OUTPUT_FILE = `${getRoot()}/bin/parser-output.json`;
let outputFile: ParserOutputFile = { sites: [] };
interface ParserOutputFile {
  sites: Array<{
    siteName: string;
    euName?: string;
    userName?: string;
    coordinates?: Coordinates;
    address?: Address;
    status?: "ACTIVE" | "INACTIVE";
  }>;
}

async function main(): Promise<void> {
  try {
    const csvFile = readFileSync("bin/input/input_data.csv", "utf8");
    let parserData = parser.parse(csvFile, { header: true });
    // if (existsSync(OUTPUT_FILE)) {
    //     outputFile = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
    // }
    if (parserData.data) {
      console.log("Processing input rows...");
      for (let row of parserData.data) {
        // console.log(row);
        outputFile.sites.push({
          siteName: row.siteName,
          euName: row.enterpriseUnitName,
          userName: row.userName,
          coordinates: row.coordinates,
          address: row.address,
          status: row.status,
        });
      }
      console.log("\nWriting output file to: ", OUTPUT_FILE, "\n");
      writeFileSync(OUTPUT_FILE, JSON.stringify(outputFile, null, 2));
      console.log("Finished writing output file successfully.");
    } else {
      console.log("\n\tError: undefined parserData.data");
      console.log("\nparserData: \n", parserData);
    }
  } catch (error) {
    // console.log("\nVerify that bin/provisioner-input.json exists\n");
    throw error;
  }
}

main().catch((error) => {
  throw error;
});
