import { existsSync, writeFileSync } from "fs";

const TARGET = "dist-electron/Electron/Infrastructure/Clients/Base/KlipyKey.js";

if (!existsSync(TARGET)) {
    console.error(`${TARGET} does not exist. Run the build before pinning the KLIPY key.`);
    process.exit(1);
}

if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
}

const key = process.env.KLIPY_API_KEY?.trim() ?? "";
if (!key) {
    // Not fatal: the app still works, the GIF tab just reports that search is unavailable.
    console.warn("KLIPY_API_KEY is not set; this build ships without GIF search.");
    process.exit(0);
}

if (!/^[A-Za-z0-9_-]+$/.test(key)) {
    console.error("KLIPY_API_KEY should only contain letters, digits, '_' and '-'");
    process.exit(1);
}

writeFileSync(TARGET, `export const KLIPY_API_KEY = '${key}';\n`);
console.log(`Pinned KLIPY key ${key.slice(0, 4)}… into ${TARGET}`);
