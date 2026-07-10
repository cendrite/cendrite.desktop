import { asClass, asValue, AwilixContainer, createContainer, InjectionMode, Lifetime } from 'awilix';
import { BrowserWindow } from 'electron';
import { AuthenticationClient } from './Infrastructure/Clients/AuthenticationClient.js';

export interface Cradle {
    mainWindow: Electron.BrowserWindow;
    authenticationProvider: AuthenticationClient;
}

export function buildContainer(mainWindow: BrowserWindow): AwilixContainer<Cradle> {
    const container = createContainer<Cradle>({
        injectionMode: InjectionMode.CLASSIC,
        strict: true,
    });

    container.register({
        mainWindow: asValue(mainWindow),
        authenticationProvider: asClass(AuthenticationClient, { lifetime: Lifetime.SINGLETON }),
    });

    return container;
}
