import { ServerMessage } from "#electron/Application/Contracts/Services/IMessageHubHandler";

export type MessageHandler = (message: ServerMessage) => void;
