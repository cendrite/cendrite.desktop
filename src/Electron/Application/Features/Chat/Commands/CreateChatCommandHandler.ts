import { Result } from '../../../../../Shared/Result/Result.js';
import { Chat } from '../../../../Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../Domain/Entities/ChatMember.js';
import { Group } from '../../../../Domain/Entities/Group.js';
import { ChatContract } from '../../../Contracts/Models/ChatContract.js';
import { ChatMemberContract } from '../../../Contracts/Models/ChatMemberContract.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { IGroupRepository } from '../../../Contracts/Repositories/IGroupRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { CreateChatCommand } from '../Contracts/CreateChat.js';

export class CreateChatCommandHandler implements Handler<CreateChatCommand, ChatContract> {
    constructor(
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
        private readonly groupRepository: IGroupRepository,
    ) { }

    public async handle(cmd: CreateChatCommand): Promise<Result<ChatContract>> {
        const friend = await this.friendRepository.getByIds(cmd.friendIds);

        if (!friend) {
            throw new Error('Friend not found');
        }

        const chatMembers = friend.map((f) => ChatMember.create(f.id, cmd.chatMemberPrivilege, f));

        const newChat = new Chat(cmd.chatId, chatMembers, [], cmd.groupName);

        const chat = await this.chatStore.create(newChat);

        if (chat.isGroup()) {
            const group = new Group(chat.id);
            await this.groupRepository.create(group);
        }

        const chatContract = this.mapToContract(chat);

        return Result.success<ChatContract>(chatContract);
    }

    private mapToContract(chat: Chat): ChatContract {
        return new ChatContract(
            chat.id,
            chat.isGroup(),
            chat.groupName,
            chat.members.map(
                (member) =>
                    new ChatMemberContract(
                        member.id,
                        member.friend?.id ?? null,
                        member.userTag,
                        member.privilege,
                        member.displayName ?? member.friend?.displayName ?? member.userTag,
                        member.devices,
                    ),
            ),
            chat.messageTtl,
            chat.muted,
            chat.muteTimer,
            [],
        );
    }
}
