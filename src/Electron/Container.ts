import { asClass, asFunction, asValue, AwilixContainer, createContainer, InjectionMode, Lifetime } from 'awilix';
import { BrowserWindow } from 'electron';
import { AuthenticationClient } from './Infrastructure/Clients/AuthenticationClient.js';
import { TokenClient } from './Infrastructure/Clients/TokenClient.js';
import { API_URLS } from './Infrastructure/Clients/Base/Urls.js';
import { RefreshTokenRepository } from './Infrastructure/Persistence/Repositories/RefreshTokenRepository.js';
import { DeviceRepository } from './Infrastructure/Persistence/Repositories/DeviceRepository.js';
import { ApiClient } from './Infrastructure/Clients/Base/ApiClient.js';
import { NonceSigner } from './Infrastructure/Services/NonceSigner.js';
import { TokenManager } from './Infrastructure/Services/TokenManager.js';
import { InitializeTokenManagerCommandHandler } from './Application/Features/Tokens/Commands/Initialize/InitializeTokenCommandHandler.js';
import { RefreshTokenCommandHandler } from './Application/Features/Tokens/Commands/Refresh/RefreshTokenCommandHandler.js';
import { GetTokenQueryHandler } from './Application/Features/Tokens/Queries/GetTokenQueryHandler.js';
import { DeviceClient } from './Infrastructure/Clients/DeviceClient.js';
import { LoginCommandHandler } from './Application/Features/Authentication/Commands/LoginCommandHandler.js';
import { VerifyLoginCommandHandler } from './Application/Features/Authentication/Commands/VerifyLoginCommandHandler.js';
import { LogoutManager } from './Application/Services/LogoutManager/LogoutManager.js';
import { LogoutCommandHandler } from './Application/Features/Authentication/Commands/LogoutCommandHandler.js';
import { SignalManager } from './Infrastructure/Signal/SignalManager.js';
import { MessageHubHandler } from './Infrastructure/Signal/Messaging/MessageHubHandler.js';
import { KeyStoreClient } from './Infrastructure/Clients/KeyStoreClient.js';
import { ProtocolStore } from './Infrastructure/Persistence/Repositories/ProtocolStore.js';
import { KeyService } from './Application/Services/Cryptography/KeyService.js';

export interface Cradle {
    mainWindow: Electron.BrowserWindow;
    authenticationProvider: AuthenticationClient;
    tokenProvider: TokenClient;
    loginClient: ApiClient;
    logoutClient: ApiClient;
    tokenClient: ApiClient;
    initializeTokenManagerCommandHandler: InitializeTokenManagerCommandHandler;
    logoutCommandHandler: LogoutCommandHandler;
    refreshTokenCommandHandler: RefreshTokenCommandHandler;
}

export function buildContainer(mainWindow: BrowserWindow): AwilixContainer<Cradle> {
    const container = createContainer<Cradle>({
        injectionMode: InjectionMode.CLASSIC,
        strict: true,
    });

    container.register({
        mainWindow: asValue(mainWindow),
    });

    addServices(container);
    addProviders(container);
    addPersistence(container);
    addHttpClients(container);
    addHandlers(container);

    return container;
}

function addHandlers(container: AwilixContainer<Cradle>) {
    container.register({
        initializeTokenManagerCommandHandler: asClass(InitializeTokenManagerCommandHandler, {
            lifetime: Lifetime.TRANSIENT,
        }),

        // auth handlers
        loginCommandHandler: asClass(LoginCommandHandler, { lifetime: Lifetime.SINGLETON }),
        logoutCommandHandler: asClass(LogoutCommandHandler, { lifetime: Lifetime.SINGLETON }),
        refreshTokenCommandHandler: asClass(RefreshTokenCommandHandler, { lifetime: Lifetime.SINGLETON }),
        getTokenQueryHandler: asClass(GetTokenQueryHandler, { lifetime: Lifetime.SINGLETON }),
        verifyLoginCommandHandler: asClass(VerifyLoginCommandHandler, { lifetime: Lifetime.SINGLETON }),
    });
}

function addServices(container: AwilixContainer<Cradle>) {
    container.register({
        tokenManager: asClass(TokenManager, { lifetime: Lifetime.SINGLETON }),
        logoutManager: asValue(LogoutManager.getInstance()),
        nonceSigner: asClass(NonceSigner, { lifetime: Lifetime.SINGLETON }),
        keyService: asClass(KeyService, { lifetime: Lifetime.SINGLETON }),
    });
}

function addProviders(container: AwilixContainer<Cradle>) {
    container.register({
        authenticationProvider: asClass(AuthenticationClient, { lifetime: Lifetime.SINGLETON }),
        tokenProvider: asClass(TokenClient, { lifetime: Lifetime.SINGLETON }),
        deviceProvider: asClass(DeviceClient, { lifetime: Lifetime.SINGLETON }),
        keyStoreProvider: asClass(KeyStoreClient, { lifetime: Lifetime.SINGLETON }),
    });
}

function addPersistence(container: AwilixContainer<Cradle>) {
    container.register({
        refreshTokenRepository: asClass(RefreshTokenRepository, { lifetime: Lifetime.SINGLETON }),
        deviceRepository: asClass(DeviceRepository, { lifetime: Lifetime.SINGLETON }),
        protocolStore: asClass(ProtocolStore, { lifetime: Lifetime.SINGLETON }),
    });
}

function registerSignalR(container: AwilixContainer<Cradle>){
    container.register({
        signalManager: asClass(SignalManager, { lifetime: Lifetime.SINGLETON }),
        messageHubHanlder: asClass(MessageHubHandler, { lifetime: Lifetime.SINGLETON }),

    });
}

function registerApiClients(container: AwilixContainer<Cradle>) {
function addHttpClients(container: AwilixContainer<Cradle>) {
    container.register({
        deviceApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.DEVICE, null)).singleton(),
        tokenApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
        loginApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
        verifyLoginApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
        logoutApiClient: asFunction(
            (tokenManager: TokenManager) => new ApiClient(API_URLS.IDENTITY.AUTH, tokenManager),
        ).singleton(),
        keyStoreApiClient: asFunction(
            (tokenManager: TokenManager) => new ApiClient(API_URLS.KEYSTORE.BASE, tokenManager),
        ).singleton(),
    });
}
