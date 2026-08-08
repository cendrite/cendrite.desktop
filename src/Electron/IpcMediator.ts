import { BrowserWindow, ipcMain } from 'electron';
import { Mediator } from './Application/Mediator/Mediator.js';
import { CreateFriendCommandHandler } from './Application/Features/Friends/Commands/Create/CreateFriendCommandHandler.js';
import { UpdateFriendCommandHandler } from './Application/Features/Friends/Commands/Update/UpdateFriendCommandHandler.js';
import { RemoveFriendConnectionIdCommandHandler } from './Application/Features/Friends/Commands/RemoveConnectionId/RemoveFriendConnectionIdCommandHandler.js';
import { AddFriendConnectionIdCommandHandler } from './Application/Features/Friends/Commands/AddConnectionId/AddFriendConnectionIdCommandHandler.js';
import { AddUserConnectionIdCommand } from './Application/Features/User/Commands/Update/AddConnectionId/AddUserConnectionIdCommand.js';
import { AddUserConnectionIdCommandHandler } from './Application/Features/User/Commands/Update/AddConnectionId/AddUserConnectionIdCommandHandler.js';
import { RemoveUserConnectionIdCommand } from './Application/Features/User/Commands/Update/RemoveConnectionId/RemoveUserConnectionIdCommand.js';
import { RemoveUserConnectionIdCommandHandler } from './Application/Features/User/Commands/Update/RemoveConnectionId/RemoveUserConnectionIdCommandHandler.js';
import { AwilixContainer } from 'awilix';
import { Cradle } from './Container.js';

export function registerIpcHandlers(mainWindow: BrowserWindow, container: AwilixContainer<Cradle>) {
    const mediator = new Mediator(container);

    mediator.registerHandler(AddUserConnectionIdCommand.name, new AddUserConnectionIdCommandHandler());
    mediator.registerHandler(RemoveUserConnectionIdCommand.name, new RemoveUserConnectionIdCommandHandler());

    mediator.registerHandler('CreateFriendCommand', new CreateFriendCommandHandler());
    mediator.registerHandler('UpdateFriendCommand', new UpdateFriendCommandHandler());
    mediator.registerHandler('RemoveConnectionIdCommand', new RemoveFriendConnectionIdCommandHandler());
    mediator.registerHandler('AddConnectionIdCommand', new AddFriendConnectionIdCommandHandler());

    ipcMain.handle('mediator:send', async (_event, request) => {
        return await mediator.send(request);
    });
}
