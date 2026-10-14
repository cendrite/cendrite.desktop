import { ServerMessage } from "../../../Application/Contracts/Services/IMessageHubHandler.js";

export type MessageHandler = (message: ServerMessage) => void;
