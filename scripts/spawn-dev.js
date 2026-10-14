import { spawn } from "child_process";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const DEFAULT_INSTANCES = 4;
const BASE_VITE_PORT = 8082;

function parseInstanceCount(args) {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        let value;
        if (arg.startsWith("--instances=")) value = arg.split("=")[1];
        else if (arg === "--instances" || arg === "-n") value = args[i + 1];
        else if (/^\d+$/.test(arg)) value = arg;
        if (value !== undefined) {
            const count = parseInt(value, 10);
            if (!Number.isInteger(count) || count < 1) {
                console.error(`Invalid instance count: ${value}`);
                process.exit(1);
            }
            return count;
        }
    }
    return DEFAULT_INSTANCES;
}

const instanceCount = parseInstanceCount(process.argv.slice(2));

console.log(`Spawning ${instanceCount} Electron instance(s) with corresponding Vite servers...`);

// Use the project root as the base directory.
const baseDir = process.cwd();
// *** Modified line: using an absolute path for the Electron entry file ***
const electronEntry = path.join(baseDir, "dist-electron", "Electron", "Main.js");

const crossEnvCmd = os.platform() === "win32" ? "cross-env.cmd" : "cross-env";

// Ensure Electron code is transpiled first:
console.log("Transpiling Electron code...");
execSync("npm run transpile:electron", { stdio: "inherit" });

function runVite(port) {
    console.log(`▶ Starting Vite server on port ${port}...`);
    const proc = spawn(crossEnvCmd, [`PORT=${port}`, "vite"], {
        cwd: baseDir,
        stdio: "inherit",
        shell: true,
    });
    proc.on("close", (code) => {
        console.log(`Vite on port ${port} exited with code ${code}`);
    });
}

function runElectron(instanceIndex, port) {
    console.log(`🚀 Starting Electron instance ${instanceIndex} (using VITE_PORT=${port})`);
    const proc = spawn("npx", ["electron", electronEntry, "--no-sandbox"], {
        cwd: baseDir,
        stdio: "inherit",
        shell: true,
        env: {
            ...process.env,
            NODE_ENV: "spawn-development",
            ELECTRON_INSTANCE_ID: instanceIndex.toString(),
            VITE_PORT: port.toString(),
        },
    });
    proc.on("close", (code) => {
        console.log(`Electron instance ${instanceIndex} exited with code ${code}`);
    });
}

for (let i = 0; i < instanceCount; i++) {
    const port = BASE_VITE_PORT + i;
    // Start a Vite server on the chosen port.
    runVite(port);
    // Delay launching the Electron instance to give the Vite server time to start.
    setTimeout(() => runElectron(i + 1, port), 1000 * (i + 1));
}