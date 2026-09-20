// noinspection ES6MissingAwait
import 'reflect-metadata';
import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';
import { getPreloadPath, isDevelopment, isSpawnDevelopment } from './Utilities.js';
import { LogoutManager } from './Application/Services/LogoutManager/LogoutManager.js';
import * as fs from 'node:fs';
import { buildContainer } from './Container.js';
import { initializeDatabase } from './Infrastructure/Persistence/Context/DatabaseContext.js';
import { Mediator } from './Application/Mediator/Mediator.js';
import { ipcMain } from 'electron/main';
import { AppearanceSettingsRepository } from './Infrastructure/Persistence/Repositories/AppearanceSettingsRepository.js';
import { parseSettings } from './Application/Features/Settings/SettingsDocument.js';
import { AppearanceSettings } from './Application/Features/Settings/AppearanceSettings.js';
import { ResolvedTheme, Theme, WINDOW_BACKGROUND } from '../Shared/Theme.js';

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

    const storedAppearance = parseSettings(
        'appearance',
        await new AppearanceSettingsRepository().get(),
    ) as AppearanceSettings;
    const initialTheme: Theme = storedAppearance.theme;
    const resolvedTheme: ResolvedTheme =
        initialTheme === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : initialTheme;

    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        show: false,
        backgroundColor: WINDOW_BACKGROUND[resolvedTheme],

        webPreferences: {
            nodeIntegration: false,
            preload: path.join(getPreloadPath()),
            contextIsolation: true,
            additionalArguments: [`--initial-theme=${initialTheme}`],
        },
    });

    mainWindow.once('ready-to-show', () => mainWindow.show());
    if (isDevelopment() || isSpawnDevelopment()) {
        const port = process.env.VITE_PORT || '8080';
        mainWindow.loadURL('http://localhost:' + port);
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'));
    }

    const container = buildContainer(mainWindow);
    const mediator = container.resolve<Mediator>('mediator');

    await logoutManager.recoverIfNeeded(container.resolve('purgeLocalDataService'));

    ipcMain.handle('mediator:send', async (_event, request: MediatorRequest) => {
        return await mediator.send(request);
    });

    mainWindow.on('close', (event) => {
        if (logoutManager.IsLoggingOut) {
            console.log('Logout in progress, cancelling close event');
            event.preventDefault();
            return;
        }
        mainWindow.webContents.send('app-close');
    });
});
