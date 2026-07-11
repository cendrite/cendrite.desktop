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

    registerServices(container);
    registerProviders(container);
    registerRepositories(container);
    registerApiClients(container);
    registerHandlers(container);

    return container;
}

function registerHandlers(container: AwilixContainer<Cradle>) {
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

function registerServices(container: AwilixContainer<Cradle>) {
    container.register({
        tokenManager: asClass(TokenManager, { lifetime: Lifetime.SINGLETON }),
        logoutManager: asValue(LogoutManager.getInstance()),
        nonceSigner: asClass(NonceSigner, { lifetime: Lifetime.SINGLETON }),
    });
}

function registerProviders(container: AwilixContainer<Cradle>) {
    container.register({
        authenticationProvider: asClass(AuthenticationClient, { lifetime: Lifetime.SINGLETON }),
        tokenProvider: asClass(TokenClient, { lifetime: Lifetime.SINGLETON }),
        deviceProvider: asClass(DeviceClient, { lifetime: Lifetime.SINGLETON }),
    });
}

function registerRepositories(container: AwilixContainer<Cradle>) {
    container.register({
        refreshTokenRepository: asClass(RefreshTokenRepository, { lifetime: Lifetime.SINGLETON }),
        deviceRepository: asClass(DeviceRepository, { lifetime: Lifetime.SINGLETON }),
    });
}

function registerApiClients(container: AwilixContainer<Cradle>) {
    container.register({
        deviceApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.DEVICE, null)).singleton(),
        tokenApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
        loginApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
        verifyLoginApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
        logoutApiClient: asFunction(
            (tokenManager: TokenManager) => new ApiClient(API_URLS.IDENTITY.AUTH, tokenManager),
        ).singleton(),
    });
}
