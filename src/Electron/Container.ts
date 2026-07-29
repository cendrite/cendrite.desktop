import { asValue, createContainer, InferCradleFromContainer, InjectionMode } from 'awilix';
import { BrowserWindow } from 'electron';
import { applicationResolvers } from './Application/Container.js';
import { infrastructureResolvers } from './Infrastructure/Container.js';

export function buildContainer(mainWindow: BrowserWindow) {
    return createContainer({
        injectionMode: InjectionMode.CLASSIC,
        strict: true,
    })
        .register({ mainWindow: asValue(mainWindow) })
        .register(applicationResolvers)
        .register(infrastructureResolvers);
}

export type Cradle = InferCradleFromContainer<ReturnType<typeof buildContainer>>;
