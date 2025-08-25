import {ServerChatMessage} from "./ServerChatMessage.ts";
import {MessageReceipt} from "./MessageReceipt.ts";

export type Topic = {
    chat: ServerChatMessage;
    receipt: MessageReceipt;
}

export type TopicKey = keyof Topic;

export type TopicHandler<K extends TopicKey> = (payload: Topic[K]) => void;