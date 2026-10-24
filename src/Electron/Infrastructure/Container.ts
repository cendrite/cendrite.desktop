import { asClass, asFunction, Lifetime } from 'awilix';
import { DeviceRepository } from './Persistence/Repositories/DeviceRepository.js';
import { ProtocolStore } from './Persistence/Repositories/ProtocolStore.js';
import { ChatStore } from './Persistence/Repositories/ChatStore.js';
import { UserRepository } from './Persistence/Repositories/UserRepository.js';
import { MediaStore } from './Persistence/Store/MediaStore.js';
import { FriendRepository } from './Persistence/Repositories/FriendRepository.js';
import { SignalManager } from './Signal/SignalManager.js';
import { MessageHubHandler } from './Signal/Messaging/MessageHubHandler.js';
import { ChangeEventHubHandler } from './Signal/ChangeEvent/ChangeEventHubHandler.js';
import { MessageReceiver } from './Signal/Messaging/MessageReceiver.js';
import { ApiClient } from './Clients/Base/ApiClient.js';
import { Agent } from 'node:https';
import { API_URLS } from './Clients/Base/Urls.js';
import { TokenManager } from './Services/TokenManager.js';
import { NonceSigner } from './Services/NonceSigner.js';
import { SignalProtocolStore } from './Services/SignalProtocolStore.js';
import { KeyGenerator } from './Services/KeyGenerator.js';
import { PurgeLocalDataService } from './Services/PurgeLocalDataService.js';
import { SessionManager } from './Services/SessionManager.js';
import { LedgerClient } from './Clients/LedgerClient.js';
import { LedgerIdentity } from './Services/LedgerIdentity.js';
import { LedgerSyncService } from './Services/LedgerSyncService.js';
import { LedgerWriter } from './Services/LedgerWriter.js';
import { LedgerReplayService } from './Services/LedgerReplayService.js';
import { GroupKeyRepository } from './Persistence/Repositories/GroupKeyRepository.js';
import { PrivateTokenRepository } from './Persistence/Repositories/PrivateTokenRepository.js';
import { GroupRepository } from './Persistence/Repositories/GroupRepository.js';
import { LedgerLogRepository } from './Persistence/Repositories/LedgerLogRepository.js';
import { KeyStoreClient } from './Clients/KeyStoreClient.js';
import { DeviceClient } from './Clients/DeviceClient.js';
import { TokenClient } from './Clients/TokenClient.js';
import { AuthenticationClient } from './Clients/AuthenticationClient.js';
import { MediaProvider } from './Clients/MediaProvider.js';
import { UserClient } from './Clients/UserClient.js';
import { FriendClient } from './Clients/FriendClient.js';
import { EventRepository } from './Persistence/Repositories/EventRepository.js';
import { AppearanceSettingsRepository } from './Persistence/Repositories/AppearanceSettingsRepository.js';
import { SettingsRegistry } from './Services/SettingsRegistry.js';
import { PendingLoginStore } from './Services/PendingLoginStore.js';
import { MessagePump } from './Pumps/MessagePump.js';
import { DeliveryStatusUpdatePump } from './Pumps/DeliveryUpdatePump.js';
import { PreKeyPump } from './Pumps/PreKeyPump.js';
import { MetaDataStripper } from './Services/MediaMetadataStripper.js';

const services = {
    tokenManager: asClass(TokenManager, { lifetime: Lifetime.SINGLETON }),
    nonceSigner: asClass(NonceSigner, { lifetime: Lifetime.SINGLETON }),
    mediaMetadataStripper: asClass(MetaDataStripper, { lifetime: Lifetime.SINGLETON }),
    signalProtocolStore: asClass(SignalProtocolStore, { lifetime: Lifetime.SINGLETON }),
    keyGenerator: asClass(KeyGenerator, { lifetime: Lifetime.SINGLETON }),
    purgeLocalDataService: asClass(PurgeLocalDataService, { lifetime: Lifetime.SINGLETON }),
    sessionManager: asClass(SessionManager, { lifetime: Lifetime.SINGLETON }),
    settingsRegistry: asClass(SettingsRegistry, { lifetime: Lifetime.SINGLETON }),
    pendingLoginStore: asClass(PendingLoginStore, { lifetime: Lifetime.SINGLETON }),
};

const persistence = {
    deviceRepository: asClass(DeviceRepository, { lifetime: Lifetime.SINGLETON }),
    protocolStore: asClass(ProtocolStore, { lifetime: Lifetime.SINGLETON }),
    chatStore: asClass(ChatStore, { lifetime: Lifetime.SINGLETON }),
    userRepository: asClass(UserRepository, { lifetime: Lifetime.SINGLETON }),
    mediaStore: asClass(MediaStore, { lifetime: Lifetime.SINGLETON }),
    friendRepository: asClass(FriendRepository, { lifetime: Lifetime.SINGLETON }),
    eventRepository: asClass(EventRepository, { lifetime: Lifetime.SINGLETON }),
    appearanceSettingsRepository: asClass(AppearanceSettingsRepository, { lifetime: Lifetime.SINGLETON }),
};

const signalR = {
    signalManager: asClass(SignalManager, { lifetime: Lifetime.SINGLETON }),
    messageHubHandler: asClass(MessageHubHandler, { lifetime: Lifetime.SINGLETON }),
    changeEventHubHandler: asClass(ChangeEventHubHandler, { lifetime: Lifetime.SINGLETON }),
    messageReceiver: asClass(MessageReceiver, { lifetime: Lifetime.SINGLETON }),
};

const ledgerServices = {
    ledgerIdentity: asClass(LedgerIdentity, { lifetime: Lifetime.SINGLETON }),
    ledgerReplayService: asClass(LedgerReplayService, { lifetime: Lifetime.SINGLETON }),
    ledgerSyncService: asClass(LedgerSyncService, { lifetime: Lifetime.SINGLETON }),
    ledgerWriter: asClass(LedgerWriter, { lifetime: Lifetime.SINGLETON }),
};

const ledgerPersistence = {
    groupKeyRepository: asClass(GroupKeyRepository, { lifetime: Lifetime.SINGLETON }),
    privateTokenRepository: asClass(PrivateTokenRepository, { lifetime: Lifetime.SINGLETON }),
    groupRepository: asClass(GroupRepository, { lifetime: Lifetime.SINGLETON }),
    ledgerLogRepository: asClass(LedgerLogRepository, { lifetime: Lifetime.SINGLETON }),
};

const providers = {
    authenticationProvider: asClass(AuthenticationClient, { lifetime: Lifetime.SINGLETON }),
    tokenProvider: asClass(TokenClient, { lifetime: Lifetime.SINGLETON }),
    deviceProvider: asClass(DeviceClient, { lifetime: Lifetime.SINGLETON }),
    keyStoreProvider: asClass(KeyStoreClient, { lifetime: Lifetime.SINGLETON }),
    ledgerProvider: asClass(LedgerClient, { lifetime: Lifetime.SINGLETON }),
    mediaProvider: asClass(MediaProvider, { lifetime: Lifetime.SINGLETON }),
    userProvider: asClass(UserClient, { lifetime: Lifetime.SINGLETON }),
    friendProvider: asClass(FriendClient, { lifetime: Lifetime.SINGLETON }),
};

const jobs = {
    messagePump: asClass(MessagePump, { lifetime: Lifetime.SINGLETON }),
    deliveryStatusUpdatePump: asClass(DeliveryStatusUpdatePump, { lifetime: Lifetime.SINGLETON }),
    preKeyPump: asClass(PreKeyPump, { lifetime: Lifetime.SINGLETON }),
}

const httpClients = {
    deviceApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.DEVICE, null)).singleton(),
    tokenApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
    loginApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
    verifyLoginApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.AUTH, null)).singleton(),
    identityUserApiClient: asFunction(() => new ApiClient(API_URLS.IDENTITY.USER.BASE, null)).singleton(),

    logoutApiClient: asFunction(
        (tokenManager: TokenManager) => new ApiClient(API_URLS.IDENTITY.AUTH, tokenManager),
    ).singleton(),

    keyStoreApiClient: asFunction(
        (tokenManager: TokenManager) => new ApiClient(API_URLS.KEYSTORE.BASE, tokenManager),
    ).singleton(),

    ledgerApiClient: asFunction(
        () => new ApiClient(API_URLS.LEDGER.BASE, null, new Agent({ keepAlive: true })),
    ).singleton(),

    ledgerCreateApiClient: asFunction(
        (tokenManager: TokenManager) => new ApiClient(API_URLS.LEDGER.BASE, tokenManager),
    ).singleton(),

    mediaApiClient: asFunction(
        (tokenManager: TokenManager) => new ApiClient(API_URLS.MEDIA.BASE, tokenManager),
    ).singleton(),

    userApiClient: asFunction((tokenManager: TokenManager) => new ApiClient(API_URLS.USER, tokenManager)).singleton(),

    friendApiClient: asFunction(
        (tokenManager: TokenManager) => new ApiClient(API_URLS.FRIEND.BASE, tokenManager),
    ).singleton(),
};

export const infrastructureResolvers = {
    ...services,
    ...persistence,
    ...signalR,
    ...ledgerPersistence,
    ...ledgerServices,
    ...providers,
    ...jobs,
    ...httpClients,
};
