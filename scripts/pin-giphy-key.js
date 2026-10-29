import { existsSync, writeFileSync } from "fs";

const TARGET = "dist-electron/Electron/Infrastructure/Clients/Base/GiphyKey.js";

if (!existsSync(TARGET)) {
    console.error(`${TARGET} does not exist. Run the build before pinning the GIPHY key.`);
    process.exit(1);
}

const key = process.env.GIPHY_API_KEY?.trim() ?? "";
if (!key) {
    // Not fatal: the app still works, the GIF tab just reports that search is unavailable.
    console.warn("GIPHY_API_KEY is not set; this build ships without GIF search.");
    process.exit(0);
}

if (!/^[A-Za-z0-9]+$/.test(key)) {
    console.error("GIPHY_API_KEY should be alphanumeric");
    process.exit(1);
}

writeFileSync(TARGET, `export const GIPHY_API_KEY = '${key}';\n`);
console.log(`Pinned GIPHY key ${key.slice(0, 4)}… into ${TARGET}`);
