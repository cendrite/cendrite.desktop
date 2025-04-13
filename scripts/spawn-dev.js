import { spawn } from "child_process";
import path from "path";
import os from "os";
import { execSync } from "child_process";

// Parse command-line arguments to get instance count (default: 4)
const args = process.argv.slice(2);
let instanceCount = 4;
args.forEach(arg => {
    if (arg.startsWith("--instances=")) {
        const value = arg.split("=")[1];
        instanceCount = parseInt(value, 10) || 4;
    }
});

console.log(`Spawning ${instanceCount} Electron instance(s) with corresponding Vite servers...`);

// Use the project root as the base directory.
const baseDir = process.cwd();
// *** Modified line: using an absolute path for the Electron entry file ***
const electronEntry = path.join(baseDir, "dist-electron", "Electron", "Main.js");

const crossEnvCmd = os.platform() === "win32" ? "cross-env.cmd" : "cross-env";

// Ensure Electron code is transpiled first:
console.log("Transpiling Electron code...");
execSync("npm run transpile:electron", { stdio: "inherit" });

// Define the ports to use for Vite. Expand this array as needed.
const vitePorts = [8082, 8083, 8084, 8085];

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
    const proc = spawn("npx", ["electron", electronEntry], {
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

// Launch the specified number of instances. We'll assume that instanceCount does not exceed the number of provided Vite ports.
for (let i = 0; i < instanceCount; i++) {
    // Cycle through the defined Vite ports if more instances are requested.
    const port = vitePorts[i % vitePorts.length];
    // Start a Vite server on the chosen port.
    runVite(port);
    // Delay launching the Electron instance to give the Vite server time to start.
    setTimeout(() => runElectron(i + 1, port), 1000 * (i + 1));
}