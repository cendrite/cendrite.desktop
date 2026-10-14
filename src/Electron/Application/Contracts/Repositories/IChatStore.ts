import { Chat } from '#electron/Domain/Aggregates/Chat';
import { Message } from '#electron/Domain/Entities/Message';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';

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
     * Get a chat by its ID, with its members and the devices behind them
     **/
    getChatWithMembers(chatId: string): Promise<Chat>;

    /**
     * Get all chats, limited by the specified number
     **/
    getChats(limit: number): Promise<Chat[]>;

    /**
     * Get a message by its ID
     **/
    getMessage(chatId: string, messageId: string): Promise<Message | null>;

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
     * Get next pending message for any chat,
     **/
    getNextPendingMessage(): Promise<Message | null>;

    /**
     * Clear all chats and messages from the store
     **/
    clear(): Promise<void>;

    /**
        * Mark delivery status for message
    **/
    markMessage(messageId: string, status: DeliveryStatus): Promise<void>;
}
