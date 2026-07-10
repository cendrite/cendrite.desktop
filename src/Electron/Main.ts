// noinspection ES6MissingAwait
import 'reflect-metadata';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { getPreloadPath, isDevelopment, isSpawnDevelopment } from './Utilities.js';
import { initializeDatabase } from './Persistence/Context/DatabaseContext.js';
import { LogoutManager } from './Application/Services/LogoutManager/LogoutManager.js';
import { registerIpcHandlers as setupMediator } from './IpcMediator.js';
import * as fs from 'node:fs';
import { buildContainer } from './Container.js';

if (process.env.ELECTRON_INSTANCE_ID) {
    console.log(`ELECTRON_INSTANCE_ID: ${process.env.ELECTRON_INSTANCE_ID}`);
    const defaultUserData = app.getPath('userData');
    const instanceFolder = path.join(defaultUserData, process.env.ELECTRON_INSTANCE_ID);
    if (!fs.existsSync(instanceFolder)) {
        fs.mkdirSync(instanceFolder, { recursive: true });
    }
    app.setPath('userData', instanceFolder);
    console.log(`User data path set to: ${app.getPath('userData')}`);
}

app.on('ready', async () => {
    const dbPath = process.env.ELECTRON_INSTANCE_ID ? path.join(app.getPath('userData'), 'msg.sqlite') : null;
    await initializeDatabase(dbPath);

    const logoutManager = LogoutManager.getInstance();
    await logoutManager.recoverIfNeeded();

    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,

        webPreferences: {
            nodeIntegration: false,
            preload: path.join(getPreloadPath()),
            contextIsolation: true,
        },
    });
    if (isDevelopment() || isSpawnDevelopment()) {
        const port = process.env.VITE_PORT || '8080';
        mainWindow.loadURL('http://localhost:' + port);
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'));
    }

    const container =  buildContainer(mainWindow);
    setupMediator(mainWindow, container);

    mainWindow.on('close', (event) => {
        if (logoutManager.IsLoggingOut) {
            console.log('Logout in progress, cancelling close event');
            event.preventDefault();
            return;
        }
        mainWindow.webContents.send('app-close');
    });
});
