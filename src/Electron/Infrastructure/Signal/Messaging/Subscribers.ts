import { ServerMessage } from "./ServerMessage.js";

export type MessageHandler = (message: ServerMessage) => void;
