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
import { KeyGenerator } from './Application/Services/Cryptography/KeyService.js';
import { SessionManager } from './Infrastructure/Services/SessionManager.js';
import { KeyService } from './Infrastructure/Services/KeyStore.js';
import { SendMessageCommandHandler } from './Application/Features/Chat/Commands/SendMessageCommandHandler.js';
import { MediaProvider } from './Infrastructure/Clients/MediaProvider.js';
import { MediaService } from './Application/Services/Media/MediaService.js';
import { ChatStore } from './Infrastructure/Persistence/Repositories/ChatStore.js';
import { StartupCommandHandler } from './Application/Features/Authentication/Commands/StartupCommandHandler.js';
import { SignNonceRequestHandler } from './Application/Features/Device/Commands/SignNonce/SignNonceRequestHandler.js';
import { UserRepository } from './Infrastructure/Persistence/Repositories/UserRepository.js';
import { ChangeEventHubHandler } from './Infrastructure/Signal/ChangeEvent/ChangeEventHubHandler.js';
import { MediaStore } from './Infrastructure/Persistence/Store/MediaStore.js';
import { AddMessageCommandHandler } from './Application/Features/Chat/Commands/AddMessage/AddMessageCommandHandler.js';
import { GetChatsQueryHandler } from './Application/Features/Chat/Queries/GetChats/GetChatsQueryhandler.js';
import { GetMessagesQueryHandler } from './Application/Features/Chat/Queries/GetMessages/GetMessagesQueryHandler.js';

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
    registerSignalR(container);

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
        sendMessageCommandHandler: asClass(SendMessageCommandHandler, { lifetime: Lifetime.SINGLETON }),
        startupCommandHandler: asClass(StartupCommandHandler, { lifetime: Lifetime.SINGLETON }),
        signNonceRequestHandler: asClass(SignNonceRequestHandler, { lifetime: Lifetime.SINGLETON }),

        // chat handlers
        addMessageCommandHandler: asClass(AddMessageCommandHandler, { lifetime: Lifetime.SINGLETON }),
        getChatsQueryHandler: asClass(GetChatsQueryHandler, { lifetime: Lifetime.SINGLETON }),
        getMessagesQueryHandler: asClass(GetMessagesQueryHandler, { lifetime: Lifetime.SINGLETON }),
    });
}

function addServices(container: AwilixContainer<Cradle>) {
    container.register({
        tokenManager: asClass(TokenManager, { lifetime: Lifetime.SINGLETON }),
        logoutManager: asValue(LogoutManager.getInstance()),
        nonceSigner: asClass(NonceSigner, { lifetime: Lifetime.SINGLETON }),
        keyGenerator: asClass(KeyGenerator, { lifetime: Lifetime.SINGLETON }),
        keyService: asClass(KeyService, { lifetime: Lifetime.SINGLETON }),
        sessionManager: asClass(SessionManager, { lifetime: Lifetime.SINGLETON }),
        mediaService: asClass(MediaService, { lifetime: Lifetime.SINGLETON }),
    });
}

function addProviders(container: AwilixContainer<Cradle>) {
    container.register({
        authenticationProvider: asClass(AuthenticationClient, { lifetime: Lifetime.SINGLETON }),
        tokenProvider: asClass(TokenClient, { lifetime: Lifetime.SINGLETON }),
        deviceProvider: asClass(DeviceClient, { lifetime: Lifetime.SINGLETON }),
        keyStoreProvider: asClass(KeyStoreClient, { lifetime: Lifetime.SINGLETON }),
        mediaProvider: asClass(MediaProvider, { lifetime: Lifetime.SINGLETON }),
    });
}

function addPersistence(container: AwilixContainer<Cradle>) {
    container.register({
        refreshTokenRepository: asClass(RefreshTokenRepository, { lifetime: Lifetime.SINGLETON }),
        deviceRepository: asClass(DeviceRepository, { lifetime: Lifetime.SINGLETON }),
        protocolStore: asClass(ProtocolStore, { lifetime: Lifetime.SINGLETON }),
        chatStore: asClass(ChatStore, { lifetime: Lifetime.SINGLETON }),
        userRepository: asClass(UserRepository, { lifetime: Lifetime.SINGLETON }),
        mediaStore: asClass(MediaStore, { lifetime: Lifetime.SINGLETON }),
    });
}

function registerSignalR(container: AwilixContainer<Cradle>) {
    container.register({
        signalManager: asClass(SignalManager, { lifetime: Lifetime.SINGLETON }),
        messageHubHandler: asClass(MessageHubHandler, { lifetime: Lifetime.SINGLETON }),
        changeEventHubHandler: asClass(ChangeEventHubHandler, { lifetime: Lifetime.SINGLETON }),
    });
}

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
        mediaApiClient: asFunction(
            (tokenManager: TokenManager) => new ApiClient(API_URLS.MEDIA.BASE, tokenManager),
        ).singleton(),
    });
}
