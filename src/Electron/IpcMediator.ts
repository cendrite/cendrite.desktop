import { BrowserWindow, ipcMain } from 'electron';
import { Mediator } from './Application/Mediator/Mediator.js';
import { CreateDeviceCommandHandler } from './Application/Features/Device/Commands/CreateDevice/CreateDeviceHandler.js';
import { GetDeviceQueryHandler } from './Application/Features/Device/Queries/GetDevice/GetDeviceQueryHandler.js';
import { GenerateKeysRequestHandler } from './Application/Features/Device/Commands/GenerateKeys/GenerateKeysRequestHandler.js';
import { CreateRefreshTokenRequestHandler } from './Application/Features/RefreshToken/Commands/Create/CreateRefreshTokenRequestHandler.js';
import { GetUserQueryHandler } from './Application/Features/User/Queries/GetUserQueryHandler.js';
import { GetMediaQueryHandler } from './Application/Features/Files/Queries/GetMedia/GetMediaQueryHandler.js';
import { CreateFriendCommandHandler } from './Application/Features/Friends/Commands/Create/CreateFriendCommandHandler.js';
import { GetFriendsQueryHandler } from './Application/Features/Friends/Queries/GetFriends/GetFriendsQueryHandler.js';
import { GetRefreshTokenQueryHandler } from './Application/Features/RefreshToken/Queries/GetRefreshTokenQueryHandler.js';
import { DeleteFriendCommandHandler } from './Application/Features/Friends/Commands/Delete/DeleteFriendCommandHandler.js';
import { CreateChatCommandHandler } from './Application/Features/Chat/Commands/Create/CreateChatCommandHandler.js';
import { UpdateFriendCommandHandler } from './Application/Features/Friends/Commands/Update/UpdateFriendCommandHandler.js';
import { GenerateKeyBundleCommandHandler } from './Application/Features/Encryption/Commands/Generate/GenerateKeyBundleCommandHandler.js';
import { RemoveFriendConnectionIdCommandHandler } from './Application/Features/Friends/Commands/RemoveConnectionId/RemoveFriendConnectionIdCommandHandler.js';
import { AddFriendConnectionIdCommandHandler } from './Application/Features/Friends/Commands/AddConnectionId/AddFriendConnectionIdCommandHandler.js';
import { AddUserConnectionIdCommand } from './Application/Features/User/Commands/Update/AddConnectionId/AddUserConnectionIdCommand.js';
import { AddUserConnectionIdCommandHandler } from './Application/Features/User/Commands/Update/AddConnectionId/AddUserConnectionIdCommandHandler.js';
import { RemoveUserConnectionIdCommand } from './Application/Features/User/Commands/Update/RemoveConnectionId/RemoveUserConnectionIdCommand.js';
import { RemoveUserConnectionIdCommandHandler } from './Application/Features/User/Commands/Update/RemoveConnectionId/RemoveUserConnectionIdCommandHandler.js';
import { PersistsKeyBundleCommandHandler } from './Application/Features/Encryption/Commands/Create/Bundle/PersistKeyBundleCommandHandler.js';
import { PersistKeyBundleCommand } from './Application/Features/Encryption/Commands/Create/Bundle/PersistKeyBundleCommand.js';
import { CreatePreKeyCommand } from './Application/Features/Encryption/Commands/Create/PreKey/CreatePreKeyCommand.js';
import { CreatePreKeyCommandHandler } from './Application/Features/Encryption/Commands/Create/PreKey/CreatePreKeyCommandHandler.js';
import { DeletePreKeyCommand } from './Application/Features/Encryption/Commands/Delete/PreKey/DeletePreKeyCommand.js';
import { DeletePreKeyCommandHandler } from './Application/Features/Encryption/Commands/Delete/PreKey/DeletePreKeyCommandHandler.js';
import { CreateSessionCommand } from './Application/Features/Encryption/Commands/Create/Session/CreateSessionCommand.js';
import { CreateIdentityCommand } from './Application/Features/Encryption/Commands/Create/IdentityCache/CreateIdentityCommand.js';
import { GetIdentityKeyPairQuery } from './Application/Features/Encryption/Queries/GetIdentityKeyPair/GetIdentityKeyPairQuery.js';
import { GetPreKeyQuery } from './Application/Features/Encryption/Queries/GetPreKey/GetPreKeyQuery.js';
import { GetRegistrationIdQuery } from './Application/Features/Encryption/Queries/GetRegistrationId/GetRegistrationIdQuery.js';
import { CreateSessionCommandHandler } from './Application/Features/Encryption/Commands/Create/Session/CreateSessionCommandHandler.js';
import { GetIdentityKeyPairQueryHandler } from './Application/Features/Encryption/Queries/GetIdentityKeyPair/GetIdentityKeyPairQueryHandler.js';
import { GetRegistrationIdQueryHandler } from './Application/Features/Encryption/Queries/GetRegistrationId/GetRegistrationIdQueryHandler.js';
import { GetSessionQuery } from './Application/Features/Encryption/Queries/GetSession/GetSessionQuery.js';
import { GetSignedPreKeyQuery } from './Application/Features/Encryption/Queries/GetSignedPreKey/GetSignedPreKeyQuery.js';
import { GetIdentityCacheQuery } from './Application/Features/Encryption/Queries/GetIdentityCache/GetIdentityCacheQuery.js';
import { GetIdentityCacheQueryHandler } from './Application/Features/Encryption/Queries/GetIdentityCache/GetIdentityCacheQueryHandler.js';
import { CreateIdentityCommandHandler } from './Application/Features/Encryption/Commands/Create/IdentityCache/CreateIdentityCommandHandler.js';
import { GetSessionQueryHandler } from './Application/Features/Encryption/Queries/GetSession/GetSessionQueryHandler.js';
import { GetSignedPreKeyQueryHandler } from './Application/Features/Encryption/Queries/GetSignedPreKey/GetSignedPreKeyQueryHandler.js';
import { GetPreKeyQueryHandler } from './Application/Features/Encryption/Queries/GetPreKey/GetPreKeyQueryHandler.js';
import { CreateChatCommand } from './Application/Features/Chat/Commands/Create/CreateChatCommand.js';
import { UpdateDeliveryStatusCommand } from './Application/Features/Chat/Commands/UpdateDeliveryStatus/UpdateDeliveryStatusCommand.js';
import { UpdateDeliveryStatusCommandHandler } from './Application/Features/Chat/Commands/UpdateDeliveryStatus/UpdateDeliveryStatusCommandHandler.js';
import { DeleteChatCommand } from './Application/Features/Chat/Commands/Delete/DeleteChatCommand.js';
import { DeleteChatCommandHandler } from './Application/Features/Chat/Commands/Delete/DeleteChatCommandHandler.js';
import { AwilixContainer } from 'awilix';
import { Cradle } from './Container.js';

export function registerIpcHandlers(mainWindow: BrowserWindow, container: AwilixContainer<Cradle>) {
    const mediator = new Mediator(container);

    mediator.registerHandler('CreateDeviceRequest', new CreateDeviceCommandHandler());
    mediator.registerHandler('GenerateKeysRequest', new GenerateKeysRequestHandler());
    mediator.registerHandler('GetDeviceQuery', new GetDeviceQueryHandler());

    mediator.registerHandler('CreateRefreshTokenRequest', new CreateRefreshTokenRequestHandler());
    mediator.registerHandler('GetRefreshTokenQuery', new GetRefreshTokenQueryHandler());

    mediator.registerHandler('GetUserQuery', new GetUserQueryHandler());
    mediator.registerHandler(AddUserConnectionIdCommand.name, new AddUserConnectionIdCommandHandler());
    mediator.registerHandler(RemoveUserConnectionIdCommand.name, new RemoveUserConnectionIdCommandHandler());

    mediator.registerHandler('GetMediaQuery', new GetMediaQueryHandler(mainWindow));

    mediator.registerHandler('CreateFriendCommand', new CreateFriendCommandHandler());
    mediator.registerHandler('GetFriendsQuery', new GetFriendsQueryHandler());
    mediator.registerHandler('DeleteFriendCommand', new DeleteFriendCommandHandler());
    mediator.registerHandler('UpdateFriendCommand', new UpdateFriendCommandHandler());
    mediator.registerHandler('RemoveConnectionIdCommand', new RemoveFriendConnectionIdCommandHandler());
    mediator.registerHandler('AddConnectionIdCommand', new AddFriendConnectionIdCommandHandler());

    mediator.registerHandler('GenerateKeyBundleCommand', new GenerateKeyBundleCommandHandler());
    mediator.registerHandler(PersistKeyBundleCommand.name, new PersistsKeyBundleCommandHandler());
    mediator.registerHandler(DeletePreKeyCommand.name, new DeletePreKeyCommandHandler());
    mediator.registerHandler(CreateSessionCommand.name, new CreateSessionCommandHandler());
    mediator.registerHandler(CreateIdentityCommand.name, new CreateIdentityCommandHandler());
    mediator.registerHandler(CreatePreKeyCommand.name, new CreatePreKeyCommandHandler());
    mediator.registerHandler(GetIdentityKeyPairQuery.name, new GetIdentityKeyPairQueryHandler());
    mediator.registerHandler(GetPreKeyQuery.name, new GetPreKeyQueryHandler());
    mediator.registerHandler(GetRegistrationIdQuery.name, new GetRegistrationIdQueryHandler());
    mediator.registerHandler(GetSessionQuery.name, new GetSessionQueryHandler());
    mediator.registerHandler(GetSignedPreKeyQuery.name, new GetSignedPreKeyQueryHandler());
    mediator.registerHandler(GetIdentityCacheQuery.name, new GetIdentityCacheQueryHandler());

    mediator.registerHandler(CreateChatCommand.name, new CreateChatCommandHandler());
    mediator.registerHandler(UpdateDeliveryStatusCommand.name, new UpdateDeliveryStatusCommandHandler());
    mediator.registerHandler(DeleteChatCommand.name, new DeleteChatCommandHandler());

    ipcMain.handle('mediator:send', async (_event, request) => {
        return await mediator.send(request);
    });
}
