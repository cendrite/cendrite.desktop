import { existsSync, writeFileSync } from "fs";

const ISSUER_DIRECTORY = "https://conduit.xhykl49jkg.org/.well-known/private-token-issuer-directory";
const TARGET = "dist-electron/Electron/Infrastructure/Clients/Base/TokenIssuer.js";
const BLIND_RSA_TOKEN_TYPE = 2;
const PSS_SPKI_LENGTH = 342;

if (!existsSync(TARGET)) {
    console.error(`${TARGET} does not exist. Run the build before pinning the issuer key.`);
    process.exit(1);
}

const response = await fetch(ISSUER_DIRECTORY);
if (!response.ok) {
    console.error(`Could not fetch the token issuer directory: ${response.status} ${response.statusText}`);
    process.exit(1);
}

const directory = await response.json();
const tokenKey = directory["token-keys"]?.find((key) => key["token-type"] === BLIND_RSA_TOKEN_TYPE)?.["token-key"];
if (!tokenKey) {
    console.error("The token issuer directory has no blind RSA key");
    process.exit(1);
}

const length = Buffer.from(tokenKey, "base64url").length;
if (length !== PSS_SPKI_LENGTH) {
    console.error(`The issuer key is ${length} bytes, expected an RSA-2048 PSS key of ${PSS_SPKI_LENGTH}`);
    process.exit(1);
}

writeFileSync(TARGET, `export const TOKEN_ISSUER_PUBLIC_KEY = '${tokenKey}';\n`);
console.log(`Pinned token issuer key ${tokenKey.slice(0, 16)}… into ${TARGET}`);
