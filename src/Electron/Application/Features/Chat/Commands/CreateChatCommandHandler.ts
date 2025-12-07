import { Result } from '../../../../../Shared/Result/Result.js';
import { Handler } from '../../../Mediator/Handler.js';
import { CreateChatCommand } from './CreateChatCommand.js';
import { CreateChatDto } from './CreateChatDto.js';
import { Chat } from '../../../../Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../Domain/Entities/ChatMember.js';
import { FriendRepository } from '../../../../Persistence/Repositories/FriendRepository.js';
import { ChatRepository } from '../../../../Persistence/Repositories/ChatRepository.js';
import { Friend } from '../../../../Domain/Aggregates/Friend.js';

export class CreateChatCommandHandler implements Handler<CreateChatCommand, CreateChatDto> {
    async handle(request: CreateChatCommand): Promise<Result<CreateChatDto>> {
        const friend = await this.getFriend(request.friendId);
        const chatMember = ChatMember.create(request.chatMemberId, request.chatMemberPrivilege, friend);

        const _chatRepository = new ChatRepository();
        const chat = await _chatRepository.create(new Chat(request.chatId, [chatMember]));

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
