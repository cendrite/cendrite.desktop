import {BrowserWindow, ipcMain} from "electron";
import { Mediator } from "../Application/Mediator/Mediator.js";
import { CreateDeviceRequestHandler } from "../Application/Features/Device/Commands/CreateDevice/CreateDeviceHandler.js";
import { GenerateKeysRequestHandler } from "../Application/Features/Device/Commands/GenerateKeys/GenerateKeysRequestHandler.js";
import { SignNonceRequestHandler } from "../Application/Features/Device/Commands/SignNonce/SignNonceRequestHandler.js";
import { CreateRefreshTokenRequestHandler } from "../Application/Features/RefreshToken/Commands/Create/CreateRefreshTokenRequestHandler.js";
import { GetRefreshTokenQueryHandler } from "../Application/Features/RefreshToken/Queries/GetRefreshTokenQueryHandler.js";
import { GetDeviceQueryHandler } from "../Application/Features/Device/Queries/GetDevice/GetDeviceQueryHandler.js";
import {GetUserQueryHandler} from "../Application/Features/User/Queries/GetUserQueryHandler.js";
import {CreateUserCommandHandler} from "../Application/Features/User/Commands/Create/CreateUserCommandHandler.js";
import {LogoutCommandHandler} from "../Application/Features/User/Commands/Logout/LogoutCommandHandler.js";
import {
    UpdateProfilePictureCommandHandler
} from "../Application/Features/User/Commands/Update/ProfilePicture/UpdateProfilePictureCommandHandler.js";
import {GetMediaQueryHandler} from "../Application/Features/Files/Queries/GetMedia/GetMediaQueryHandler.js";
import {
    CreateFriendCommandHandler
} from "../Application/Features/Friends/Commands/Create/CreateFriendCommandHandler.js";
import {CreateFriendCommand} from "../Application/Features/Friends/Commands/Create/CreateFriendCommand.js";
import {GetFriendsQueryHandler} from "../Application/Features/Friends/Queries/GetFriends/GetFriendsQueryHandler.js";

export function registerIpcHandlers(mainWindow: BrowserWindow) {
    const mediator = new Mediator();

    mediator.registerHandler("CreateDeviceRequest", new CreateDeviceRequestHandler());
    mediator.registerHandler("GenerateKeysRequest", new GenerateKeysRequestHandler());
    mediator.registerHandler("GetDeviceQuery", new GetDeviceQueryHandler());
    mediator.registerHandler("SignNonceRequest", new SignNonceRequestHandler());
    mediator.registerHandler("LogoutCommand", new LogoutCommandHandler());

    mediator.registerHandler("CreateRefreshTokenRequest", new CreateRefreshTokenRequestHandler());
    mediator.registerHandler("GetRefreshTokenQuery", new GetRefreshTokenQueryHandler());

    mediator.registerHandler("GetUserQuery", new GetUserQueryHandler());
    mediator.registerHandler("CreateUserCommand", new CreateUserCommandHandler());
    mediator.registerHandler("UpdateProfilePictureCommand", new UpdateProfilePictureCommandHandler());

    mediator.registerHandler("GetMediaQuery", new GetMediaQueryHandler(mainWindow));

    mediator.registerHandler("CreateFriendCommand", new CreateFriendCommandHandler());
    mediator.registerHandler("GetFriendsQuery", new GetFriendsQueryHandler());

    ipcMain.handle("mediator:send", async (event, request) => {
        return await mediator.send(request);
    });
}