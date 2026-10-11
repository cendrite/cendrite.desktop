import { Result } from '../../../../../Shared/Result/Result.js';
import { Chat } from '../../../../Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../../Domain/Entities/ChatMember.js';
import { Group } from '../../../../Domain/Entities/Group.js';
import { GroupEpochKey } from '../../../../Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../../Domain/Encryption/GroupWriteKey.js';
import { generateEpochKey, generateWriteKeyPair } from '../../../../Infrastructure/Crypto/LedgerCodec.js';
import { ChatContract } from '../../../Contracts/Models/ChatContract.js';
import { ChatMemberContract } from '../../../Contracts/Models/ChatMemberContract.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { IGroupKeyRepository } from '../../../Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../../Contracts/Repositories/IGroupRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { CreateChatCommand } from '../Contracts/CreateChat.js';

export class CreateChatCommandHandler implements Handler<CreateChatCommand, ChatContract> {
    constructor(
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
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
            await this.createGroup(chat.id);
        }

        const chatContract = this.mapToContract(chat, cmd.isGroup);

        return Result.success<ChatContract>(chatContract);
    }

    private async createGroup(groupId: string): Promise<void> {
        const writeKey = generateWriteKeyPair();

        await this.groupKeyRepository.saveWriteKey(
            new GroupWriteKey(groupId, writeKey.publicKey, writeKey.privateKey),
        );
        await this.groupKeyRepository.saveEpochKey(new GroupEpochKey(groupId, 1, generateEpochKey()));
        await this.groupRepository.create(new Group(groupId));
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
