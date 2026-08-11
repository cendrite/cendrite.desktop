import { asValue, createContainer, InferCradleFromContainer, InjectionMode } from 'awilix';
import { BrowserWindow } from 'electron';
import { applicationResolvers } from './Application/Container.js';
import { infrastructureResolvers } from './Infrastructure/Container.js';
import { Mediator } from './Application/Mediator/Mediator.js';

export function buildContainer(mainWindow: BrowserWindow) {
    const container = createContainer({
        injectionMode: InjectionMode.CLASSIC,
        strict: true,
    })
        .register({ mainWindow: asValue(mainWindow) })
        .register(applicationResolvers)
        .register(infrastructureResolvers);

    container.register({ mediator: asValue(new Mediator(container)) });
    return container;
}

export type Cradle = InferCradleFromContainer<ReturnType<typeof buildContainer>>;
