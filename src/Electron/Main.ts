import { app, BrowserWindow } from 'electron';
import path from "path";
import { getPreloadPath, isDevelopment } from "./Utilities.js";
import { initializeDatabase } from './Persistence/Context/DatabaseContext.js';
import { CryptographyService } from './Persistence/Encryption/CryptographyService.js';

app.on("ready", async () => {
    await initializeDatabase();
    const cryptoService = CryptographyService.getInstance();
    await cryptoService.initializeEncryptionKey();

    const mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(getPreloadPath())
        }
    });
    if (isDevelopment()) {
        mainWindow.loadURL("http://localhost:8080");
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'))
    }
});
