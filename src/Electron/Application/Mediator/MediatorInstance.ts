import { CreateDeviceRequestHandler } from "../Features/Device/Commands/CreateDevice/CreateDeviceHandler.js";
import { GenerateKeysRequestHandler } from "../Features/Device/Commands/GenerateKeys/GenerateKeysRequestHandler.js";
import { Mediator } from "./Mediator.js";

const mediator = new Mediator();

mediator.registerHandler("CreateDevice", new CreateDeviceRequestHandler());
mediator.registerHandler("GenerateKeysRequest", new GenerateKeysRequestHandler());

export default mediator;