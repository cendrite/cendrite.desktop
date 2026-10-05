import { Repository } from 'typeorm';
import { Chat } from '../../../Domain/Aggregates/Chat.js';
import { getDbContext } from '../Context/DatabaseContext.js';
import { ChatMember } from '../../../Domain/Entities/ChatMember.js';
import { Message } from '../../../Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';
import { IChatStore } from '../../../Application/Contracts/Repositories/IChatStore.js';

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

    getMessage(chatId: string, messageId: string): Promise<Message | null> {
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

    public async getChatWithMembers(chatId: string): Promise<Chat | null> {
        return this.chatRepository.findOne({
            where: { id: chatId },
            relations: { members: { friend: { connectionIds: true } } },
        });
    }

    public async syncGroupMembers(chatId: string, groupName: string | null, members: ChatMember[]): Promise<void> {
        const chat = await this.getChatWithMembers(chatId);
        if (!chat) return;

        const existing = new Map(chat.members.map((member) => [member.userTag, member]));

        for (const member of members) {
            const current = existing.get(member.userTag);

            if (!current) {
                member.chat = chat;
                await this.memberRepository.save(member);
                continue;
            }

            // The friend relation is the local one-to-one link and is not the ledger's to overwrite.
            current.privilege = member.privilege;
            current.displayName = member.displayName;
            current.connectionIds = member.connectionIds;
            await this.memberRepository.save(current);
        }

        const departed = chat.members.filter((member) => !members.some((m) => m.userTag === member.userTag));
        if (departed.length > 0) {
            await this.memberRepository.remove(departed);
        }

        if (chat.groupName !== groupName) {
            chat.groupName = groupName;
            await this.chatRepository.save(chat);
        }
    }

    public async deleteByFriendId(friendId: string): Promise<void> {
        const chat = await this.chatRepository
            .createQueryBuilder('chat')
            .innerJoin('chat.members', 'member')
            .innerJoin('member.friend', 'friend')
            .where('friend.id = :friendId', { friendId })
            // Only the one-to-one chat with that friend: a group outlives any single membership.
            .andWhere('chat.groupId IS NULL')
            .getOne();

        if (chat) {
            await this.chatRepository.delete(chat.id);
        }
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
