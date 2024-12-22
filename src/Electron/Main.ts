import { app, BrowserWindow } from 'electron';
import path from "path";
import { getPreloadPath, isDevelopment } from "./Utilities.js";
import { initializeDatabase } from './Persistence/Context/DatabaseContext.js';

app.on("ready", async () => {
    await initializeDatabase();
    const mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(getPreloadPath())
        }
    });
    if (isDevelopment()) {
        mainWindow.loadURL("http://localhost:4200");
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'))
    }
});
