import path from "path";
import { app } from "electron";
import * as fs from "node:fs";
import { IPurgeLocalData } from "../../Contracts/Services/IPurgeLocalData.js";

export class LogoutManager {
    private static instance: LogoutManager;
    private isLoggingOut = false;
    private readonly flagPath: string;

    private constructor() {
        this.flagPath = path.join(app.getPath("userData"), "logout-flag.json");
        console.log("Loading logout flag...");
        this.loadFlag();
        console.log("Initial isLoggingOut value:", this.isLoggingOut);
    }

    public static getInstance() {
        if (!LogoutManager.instance) {
            LogoutManager.instance = new LogoutManager();
        }
        return LogoutManager.instance;
    }

    public get IsLoggingOut() {
        return this.isLoggingOut;
    }

    public startLogout() {
        console.log("Calling startLogout...");
        this.isLoggingOut = true;
        this.saveFlag();
        console.log("isLoggingOut set to true and saved to file.");
    }

    public endLogout() {
        console.log("Calling endLogout...");
        this.isLoggingOut = false;
        this.deleteFlag();
        console.log("isLoggingOut reset to false and file deleted.");
    }

    public async recoverIfNeeded(purger: IPurgeLocalData){
        if(this.isLoggingOut){
            console.log("Recovering from unexpected shutdown during logout...");

            await purger.purgeLocalData();

            this.endLogout();
        }
    }

    private saveFlag(): void {
        console.log("Saving flag to file...");
        fs.writeFileSync(this.flagPath, JSON.stringify({ isLoggingOut: this.isLoggingOut, lastUpdated: new Date() }, null, 2));
        console.log("Flag saved:", { isLoggingOut: this.isLoggingOut });
    }

    private deleteFlag(): void {
        if (this.isFlagSet()) {
            console.log("Deleting flag file...");
            fs.unlinkSync(this.flagPath);
            console.log("Flag file deleted.");
        }
    }

    private loadFlag(): void {
        if (this.isFlagSet()) {
            console.log("Flag file found. Loading state...");
            const flag = fs.readFileSync(this.flagPath, "utf8");
            const parsedFlag = JSON.parse(flag);
            this.isLoggingOut = parsedFlag.isLoggingOut || false;
            console.log("Loaded flag state:", this.isLoggingOut);
        } else {
            console.log("No flag file found. Defaulting isLoggingOut to false.");
        }
    }

    private isFlagSet(): boolean {
        return fs.existsSync(this.flagPath);
    }
}
