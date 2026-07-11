import { Repository } from 'typeorm';
import { Chat } from '../../../Domain/Aggregates/Chat.js';
import { getDbContext } from '../Context/DatabaseContext.js';
import { ChatMember } from '../../../Domain/Entities/ChatMember.js';
import { Message } from '../../../Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';

export class ChatStore {
    private readonly chatRepository: Repository<Chat>;
    private readonly memberRepository: Repository<ChatMember>;
    private readonly messageRepository: Repository<Message>;

    public constructor() {
        const dbContext = getDbContext();
        this.chatRepository = dbContext.getRepository(Chat);
        this.memberRepository = dbContext.getRepository(ChatMember);
        this.messageRepository = dbContext.getRepository(Message);
    }

    public async storeMessage(message: Message) {
        await this.messageRepository.save(message);
    }

    public async getChatById(chatId: string): Promise<Chat | null> {
        return this.chatRepository.findOne({
            where: { id: chatId },
        });
    }

    public async deleteChat(chatId: string): Promise<void> {
        await this.chatRepository.delete(chatId);
    }

    public async getChats(chatLoadCount: number): Promise<Chat[]> {
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
            .limit(chatLoadCount)
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

    public async deleteByFriendId(friendId: string): Promise<void> {
        const chat = await this.chatRepository
            .createQueryBuilder('chat')
            .innerJoin('chat.members', 'member')
            .innerJoin('member.friend', 'friend')
            .where('friend.id = :friendId', { friendId })
            .getOne();

        if (chat) {
            await this.chatRepository.delete(chat.id);
        }
    }

    public async create(chat: Chat): Promise<Chat> {
        return await this.chatRepository.save(chat);
    }

    public async clearStore(): Promise<void> {
        await this.chatRepository.clear();
        await this.memberRepository.clear();
        await this.messageRepository.clear();
    }
}
