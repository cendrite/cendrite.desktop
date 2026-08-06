import { BrowserWindow, ipcMain } from 'electron';
import { Mediator } from './Application/Mediator/Mediator.js';
import { CreateDeviceCommandHandler } from './Application/Features/Device/Commands/CreateDevice/CreateDeviceHandler.js';
import { GetDeviceQueryHandler } from './Application/Features/Device/Queries/GetDevice/GetDeviceQueryHandler.js';
import { GenerateKeysRequestHandler } from './Application/Features/Device/Commands/GenerateKeys/GenerateKeysRequestHandler.js';
import { CreateRefreshTokenRequestHandler } from './Application/Features/RefreshToken/Commands/Create/CreateRefreshTokenRequestHandler.js';
import { GetUserQueryHandler } from './Application/Features/User/Queries/GetUserQueryHandler.js';
import { CreateFriendCommandHandler } from './Application/Features/Friends/Commands/Create/CreateFriendCommandHandler.js';
import { GetRefreshTokenQueryHandler } from './Application/Features/RefreshToken/Queries/GetRefreshTokenQueryHandler.js';
import { CreateChatCommandHandler } from './Application/Features/Chat/Commands/Create/CreateChatCommandHandler.js';
import { UpdateFriendCommandHandler } from './Application/Features/Friends/Commands/Update/UpdateFriendCommandHandler.js';
import { RemoveFriendConnectionIdCommandHandler } from './Application/Features/Friends/Commands/RemoveConnectionId/RemoveFriendConnectionIdCommandHandler.js';
import { AddFriendConnectionIdCommandHandler } from './Application/Features/Friends/Commands/AddConnectionId/AddFriendConnectionIdCommandHandler.js';
import { AddUserConnectionIdCommand } from './Application/Features/User/Commands/Update/AddConnectionId/AddUserConnectionIdCommand.js';
import { AddUserConnectionIdCommandHandler } from './Application/Features/User/Commands/Update/AddConnectionId/AddUserConnectionIdCommandHandler.js';
import { RemoveUserConnectionIdCommand } from './Application/Features/User/Commands/Update/RemoveConnectionId/RemoveUserConnectionIdCommand.js';
import { RemoveUserConnectionIdCommandHandler } from './Application/Features/User/Commands/Update/RemoveConnectionId/RemoveUserConnectionIdCommandHandler.js';
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


    mediator.registerHandler('CreateFriendCommand', new CreateFriendCommandHandler());
    mediator.registerHandler('UpdateFriendCommand', new UpdateFriendCommandHandler());
    mediator.registerHandler('RemoveConnectionIdCommand', new RemoveFriendConnectionIdCommandHandler());
    mediator.registerHandler('AddConnectionIdCommand', new AddFriendConnectionIdCommandHandler());

    mediator.registerHandler(CreateChatCommand.name, new CreateChatCommandHandler());
    mediator.registerHandler(UpdateDeliveryStatusCommand.name, new UpdateDeliveryStatusCommandHandler());
    mediator.registerHandler(DeleteChatCommand.name, new DeleteChatCommandHandler());

    ipcMain.handle('mediator:send', async (_event, request) => {
        return await mediator.send(request);
    });
}
