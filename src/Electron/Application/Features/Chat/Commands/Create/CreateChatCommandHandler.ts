import { Result } from '../../../../../../Shared/Result/Result.js';
import { Chat } from '../../../../../Domain/Aggregates/Chat.js';
import { Friend } from '../../../../../Domain/Aggregates/Friend.js';
import { ChatMember } from '../../../../../Domain/Entities/ChatMember.js';
import { Message } from '../../../../../Domain/Entities/Message.js';
import { ChatStore } from '../../../../../Persistence/Repositories/ChatStore.js';
import { FriendRepository } from '../../../../../Persistence/Repositories/FriendRepository.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { CreateChatCommand } from './CreateChatCommand.js';
import { CreateChatDto } from './CreateChatDto.js';

export class CreateChatCommandHandler implements Handler<CreateChatCommand, CreateChatDto> {
    async handle(request: CreateChatCommand): Promise<Result<CreateChatDto>> {
        const friend = await this.getFriend(request.friendId);

        const chatMember = ChatMember.create(request.chatMemberId, request.chatMemberPrivilege, friend);

        const chatStore = new ChatStore();

        const msg = request.message
            ? new Message(
                request.message.id,
                request.chatId,
                request.message.senderId,
                request.message.timestamp,
                request.message.content,
                [],
                request.message.deliveryStatus,
            )
            : null;

        console.log('Creating new chat with:', request);
        const newChat = new Chat(
            request.chatId,
            [chatMember],
            [msg].filter((m): m is Message => m !== null),
        );

        const chat = await chatStore.create(newChat);

        const chatMemberDto = new CreateChatDto(chat, chatMember);

        return Result.success<CreateChatDto>(chatMemberDto);
    }

    private async getFriend(id: string): Promise<Friend> {
        const friendRepository = new FriendRepository();
        const friend = await friendRepository.getById(id);
        if (!friend) {
            throw new Error('Friend not found');
        }
        return friend;
    }
}
