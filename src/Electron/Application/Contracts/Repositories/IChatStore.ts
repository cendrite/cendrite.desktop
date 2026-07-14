import { Chat } from '../../../Domain/Aggregates/Chat.js';
import { Message } from '../../../Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';

export interface IChatStore {
    /**
     * Create a new chat in the store
     **/
    create(chat: Chat): Promise<Chat>;

    /**
     * Store a message in the store
     **/
    storeMessage(msg: Message): Promise<void>;

    /**
     * Get a chat by its ID
     **/
    getChat(chatId: string): Promise<Chat | null>;

    /**
     * Get all chats, limited by the specified number
     **/
    getChats(limit: number): Promise<Chat[]>;

    /**
     * Get all messages for a chat, with pagination support
     **/
    getMessages(chatId: string, skip: number, take: number): Promise<Message[]>;

    /**
     * Update the delivery status of the given messages in a chat
     **/
    updateDeliveryStatus(chatId: string, messageIds: string[], status: DeliveryStatus): Promise<void>;

    /**
     * Delete a chat by its ID
     **/
    deleteChat(chatId: string): Promise<void>;

    /**
     * Delete a chat by its friend ID
     **/
    deleteByFriendId(friendId: string): Promise<void>;

    /**
     * Clear all chats and messages from the store
     **/
    clear(): Promise<void>;
}
