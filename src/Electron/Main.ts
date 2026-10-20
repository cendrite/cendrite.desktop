// noinspection ES6MissingAwait
import 'reflect-metadata';
import { app, BrowserWindow, dialog, nativeTheme } from 'electron';
import path from 'path';
import { getAppUrl, getPreloadPath, isAppUrl } from './Utilities.js';
import { LogoutManager } from './Application/Services/LogoutManager/LogoutManager.js';
import * as fs from 'node:fs';
import { buildContainer } from './Container.js';
import { initializeDatabase } from './Infrastructure/Persistence/Context/DatabaseContext.js';
import { Mediator } from './Application/Mediator/Mediator.js';
import { ipcMain } from 'electron/main';
import { AppearanceSettingsRepository } from './Infrastructure/Persistence/Repositories/AppearanceSettingsRepository.js';
import { parseSettings } from './Application/Features/Settings/SettingsDefaults.js';
import { AppearanceSettings } from './Application/Features/Settings/AppearanceSettings.js';
import { ResolvedTheme, Theme, WINDOW_BACKGROUND } from '../Shared/Theme.js';
import { CryptographyService } from './Infrastructure/Persistence/Encryption/CryptographyService.js';

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

if (
    process.platform === 'linux' &&
    !app.commandLine.hasSwitch('password-store') &&
    !/kde/i.test(process.env.XDG_CURRENT_DESKTOP ?? '')
) {
    app.commandLine.appendSwitch('password-store', 'gnome-libsecret');
}

app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-navigate', (event, url) => {
        if (!isAppUrl(url)) event.preventDefault();
    });
    contents.on('will-attach-webview', (event) => event.preventDefault());
});

app.on('ready', async () => {
    try {
        await CryptographyService.getInstance().initializeEncryptionKey();
    } catch (err) {
        dialog.showErrorBox('Cypherly cannot start', (err as Error).message);
        app.quit();
        return;
    }

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
    mainWindow.loadURL(getAppUrl());

    const container = buildContainer(mainWindow);
    const mediator = container.resolve<Mediator>('mediator');

    await logoutManager.recoverIfNeeded(container.resolve('purgeLocalDataService'));

    ipcMain.handle('mediator:send', async (event, request: MediatorRequest) => {
        const frame = event.senderFrame;
        if (!frame || frame !== mainWindow.webContents.mainFrame || !isAppUrl(frame.url)) {
            throw new Error('Rejected mediator request from an unexpected frame');
        }

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
