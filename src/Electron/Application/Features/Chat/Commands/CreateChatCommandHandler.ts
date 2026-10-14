import { Result } from '#shared/Result/Result';
import { Chat } from '#electron/Domain/Aggregates/Chat';
import { ChatMember } from '#electron/Domain/Entities/ChatMember';
import { ChatContract } from '#shared/Models/ChatContract';
import { ChatMemberContract } from '#shared/Models/ChatMemberContract';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CreateChatCommand } from '#shared/Chat/CreateChat';
import { IGroupService } from '#electron/Application/Services/GroupService';

export class CreateChatCommandHandler implements Handler<CreateChatCommand, ChatContract> {
    constructor(
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
        private readonly groupService: IGroupService,
    ) { }

    public async handle(cmd: CreateChatCommand): Promise<Result<ChatContract>> {
        const friend = await this.friendRepository.getByIds(cmd.friendIds);

        if (!friend) {
            throw new Error('Friend not found');
        }

        const chatMembers = friend.map((f) => ChatMember.create(f.id, cmd.chatMemberPrivilege, f));

        const newChat = new Chat(cmd.chatId, chatMembers, [], cmd.groupName);

        const chat = await this.chatStore.create(newChat);

        if (cmd.isGroup) {
            await this.groupService.createGroup(chat.id);
        }

        const chatContract = this.mapToContract(chat, cmd.isGroup);

        return Result.success<ChatContract>(chatContract);
    }

    private mapToContract(chat: Chat, isGroup: boolean): ChatContract {
        return new ChatContract(
            chat.id,
            isGroup,
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
                        member.avatar,
                    ),
            ),
            chat.messageTtl,
            chat.muted,
            chat.muteTimer,
            [],
        );
    }
}
