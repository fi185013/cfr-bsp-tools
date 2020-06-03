# Automated scripts for provisioning BSP services

**Install:** run command `npm install` from root of repository.

### Run using `npx ts-node bin/*.ts` where `*` is one of the following files:

## parser.ts
Prepares `provisioner-input.json` file from a `.csv` file with site names.

## provisioner.ts
Runs API queries with `provisioner-input.json` data and generates all sites and usernames. It generates a `provisioner-output.json` file as well as a `provisioner-keys/` directory with secret/shared keys for each newly generated user account.

## exporter.ts
Creates a set of `exporter-*.json` files containing sites, users and groups.

## verifier.ts
Checks if input and output lists of users and sites match.
