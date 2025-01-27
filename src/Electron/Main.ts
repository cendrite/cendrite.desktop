// noinspection ES6MissingAwait
import "reflect-metadata";
import {app, BrowserWindow} from 'electron';
import path from "path";
import {getPreloadPath, isDevelopment} from "./Utilities.js";
import {initializeDatabase} from './Persistence/Context/DatabaseContext.js';
import {registerIpcHandlers} from './Ipc/IpcMediator.js';
import {LogoutManager} from "./Application/Services/LogoutManager/LogoutManager.js";

app.on("ready", async () => {
    await initializeDatabase();

    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,

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
    registerIpcHandlers();

    mainWindow.on('close', (event) => {
        const logoutManager = LogoutManager.getInstance();
        if (logoutManager.IsLoggingOut) {
            console.log("Logout in progress, cancelling close event");
            event.preventDefault();
            return;
        }

        console.log("Closing app");
        mainWindow.webContents.send('app-close');
    })
});
