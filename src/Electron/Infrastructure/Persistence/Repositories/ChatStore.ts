import { Repository } from 'typeorm';
import { Chat } from '#electron/Domain/Aggregates/Chat';
import { getDbContext } from '../Context/DatabaseContext.js';
import { ChatMember } from '#electron/Domain/Entities/ChatMember';
import { Message } from '#electron/Domain/Entities/Message';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';

export class ChatStore implements IChatStore {
    private readonly chatRepository: Repository<Chat>;
    private readonly memberRepository: Repository<ChatMember>;
    private readonly messageRepository: Repository<Message>;

    public constructor() {
        const dbContext = getDbContext();
        this.chatRepository = dbContext.getRepository(Chat);
        this.memberRepository = dbContext.getRepository(ChatMember);
        this.messageRepository = dbContext.getRepository(Message);
    }

    public async getMessage(chatId: string, messageId: string): Promise<Message | null> {
        return this.messageRepository.findOne({
            where: { id: messageId, chat: { id: chatId } },
            relations: { messageMedia: true },
        });
    }

    public async markMessage(messageId: string, status: DeliveryStatus): Promise<void> {
        await this.messageRepository
            .createQueryBuilder()
            .update(Message)
            .set({ deliveryStatus: status })
            .where('id = :messageId', { messageId })
            .execute();
    }

    public async getNextPendingMessage(): Promise<Message | null> {
        return this.messageRepository.findOne({
            where: { deliveryStatus: DeliveryStatus.Pending },
            order: { timestamp: 'ASC' },
        });
    }

    public async storeMessage(message: Message) {
        await this.messageRepository.save(message);
    }

    public async getChat(chatId: string): Promise<Chat | null> {
        return this.chatRepository.findOne({
            where: { id: chatId },
        });
    }

    public async getChatWithMembers(chatId: string): Promise<Chat> {
        const chat = await this.chatRepository.findOne({
            where: { id: chatId },
            relations: { members: { friend: { connectionIds: true } } },
        });
        if (!chat) {
            throw new Error(`Chat with ID ${chatId} not found`);
        }
        return chat;
    }

    public async deleteChat(chatId: string): Promise<void> {
        await this.chatRepository.delete(chatId);
    }

    public async getChats(limit: number): Promise<Chat[]> {
        return this.chatRepository
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.members', 'members')
            .leftJoinAndSelect('members.friend', 'friend')
            .leftJoinAndSelect('friend.connectionIds', 'connectionIds')
            .leftJoinAndSelect('chat.messages', 'messages')
            .addSelect('MAX(messages.timestamp)', 'latestMessage')
            .groupBy('chat.id')
            .addGroupBy('members.id')
            .addGroupBy('friend.id')
            .addGroupBy('connectionIds.id')
            .orderBy('latestMessage', 'DESC')
            .limit(limit)
            .getMany();
    }

    public async getMessages(chatId: string, skip: number, take: number): Promise<Message[]> {
        return this.messageRepository.find({
            where: { chat: { id: chatId } },
            relations: { messageMedia: true },
            skip: skip,
            order: { timestamp: 'DESC' },
            take: take,
        });
    }

    public async updateDeliveryStatus(chatId: string, messageIds: string[], status: DeliveryStatus): Promise<void> {
        await this.messageRepository
            .createQueryBuilder()
            .update(Message)
            .set({ deliveryStatus: status })
            .where('chatId = :chatId', { chatId })
            .andWhere('id IN (:...messageIds)', { messageIds })
            .execute();
    }

    // A group outlives any single membership, so only the one to one chat with that friend goes.
    public async deleteByFriendId(friendId: string): Promise<void> {
        await this.chatRepository
            .createQueryBuilder()
            .delete()
            .where('id IN (SELECT chatId FROM chat_member WHERE friendId = :friendId)', { friendId })
            .andWhere('NOT EXISTS (SELECT 1 FROM "group" WHERE "group".groupId = Chat.id)')
            .execute();
    }

    public async create(chat: Chat): Promise<Chat> {
        return await this.chatRepository.save(chat);
    }

    public async clear(): Promise<void> {
        await this.chatRepository.clear();
        await this.memberRepository.clear();
        await this.messageRepository.clear();
    }
}
