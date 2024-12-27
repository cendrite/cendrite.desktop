import { app, BrowserWindow } from 'electron';
import path from "path";
import { getPreloadPath, isDevelopment } from "./Utilities.js";
import { initializeDatabase } from './Persistence/Context/DatabaseContext.js';
import { CryptographyService } from './Persistence/Encryption/CryptographyService.js';
import { DeviceRepository } from './Persistence/Repositories/DeviceRepository.js';
import { Device } from './Persistence/Entities/Device.js';

app.on("ready", async () => {
    await initializeDatabase();
    const cryptoService = CryptographyService.getInstance();
    await cryptoService.initializeEncryptionKey();
    const repo = new DeviceRepository();
    // Create a new Device instance
    const dev = new Device();
    dev.privateKey = 'test';
    dev.publicKey = 'test';
    const savedDev = await repo.create(dev);
    console.log(savedDev.privateKey);

    const retrievedDev = await repo.get();
    console.log(retrievedDev.privateKey);
    console.log(retrievedDev.publicKey);
    console.log(retrievedDev.createdAt);

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
