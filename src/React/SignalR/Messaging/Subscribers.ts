import { ServerMessage } from './ServerMessage';

export type MessageHandler = (message: ServerMessage) => void;
