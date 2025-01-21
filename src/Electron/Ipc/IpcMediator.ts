import { ipcMain } from "electron";
import { Mediator } from "../Application/Mediator/Mediator.js";
import { CreateDeviceRequestHandler } from "../Application/Features/Device/Commands/CreateDevice/CreateDeviceHandler.js";
import { GenerateKeysRequestHandler } from "../Application/Features/Device/Commands/GenerateKeys/GenerateKeysRequestHandler.js";
import { SignNonceRequestHandler } from "../Application/Features/Device/Commands/SignNonce/SignNonceRequestHandler.js";
import { CreateRefreshTokenRequestHandler } from "../Application/Features/RefreshToken/Commands/Create/CreateRefreshTokenRequestHandler.js";
import { GetRefreshTokenQueryHandler } from "../Application/Features/RefreshToken/Queries/GetRefreshTokenQueryHandler.js";
import { GetDeviceQueryHandler } from "../Application/Features/Device/Queries/GetDevice/GetDeviceQueryHandler.js";

export function registerIpcHandlers() {
    const mediator = new Mediator();

    mediator.registerHandler("CreateDeviceRequest", new CreateDeviceRequestHandler());
    mediator.registerHandler("GenerateKeysRequest", new GenerateKeysRequestHandler());
    mediator.registerHandler("SignNonceRequest", new SignNonceRequestHandler());
    mediator.registerHandler("CreateRefreshTokenRequest", new CreateRefreshTokenRequestHandler());
    mediator.registerHandler("GetRefreshTokenQuery", new GetRefreshTokenQueryHandler());
    mediator.registerHandler("GetDeviceQuery", new GetDeviceQueryHandler());

    console.log("Registered Mediator Handlers:", Array.from(mediator["_handlers"].keys()));

    ipcMain.handle("mediator:send", async (event, request) => {
        return await mediator.send(request);
    });
}