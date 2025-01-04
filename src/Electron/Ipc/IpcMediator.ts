import { ipcMain } from "electron";
import { Mediator } from "../Application/Mediator/Mediator.js";
import { CreateDeviceRequestHandler } from "../Application/Features/Device/Commands/CreateDevice/CreateDeviceHandler.js";
import { GenerateKeysRequestHandler } from "../Application/Features/Device/Commands/GenerateKeys/GenerateKeysRequestHandler.js";
import { SignNonceRequestHandler } from "../Application/Features/Device/Commands/SignNonce/SignNonceRequestHandler.js";

export function registerIpcHandlers() {
    const mediator = new Mediator();

    mediator.registerHandler("CreateDeviceRequest", new CreateDeviceRequestHandler());
    mediator.registerHandler("GenerateKeysRequest", new GenerateKeysRequestHandler());
    mediator.registerHandler("SignNonceRequest", new SignNonceRequestHandler());


    console.log("Registered Mediator Handlers:", Array.from(mediator["_handlers"].keys()));

    ipcMain.handle("mediator:send", async (event, request) => {
        return await mediator.send(request);
    });
}