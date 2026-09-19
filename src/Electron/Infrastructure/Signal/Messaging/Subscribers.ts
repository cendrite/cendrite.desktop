import { ServerMessage } from "../../../Application/Contracts/Messaging/ServerMessage.js";

export type MessageHandler = (message: ServerMessage) => void;
