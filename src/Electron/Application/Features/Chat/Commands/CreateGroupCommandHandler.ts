import { v4 as uuid } from 'uuid';
import { Result } from '../../../../../Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Chat } from '../../../../Domain/Aggregates/Chat.js';
import { GroupEpochKey } from '../../../../Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../../Domain/Encryption/GroupWriteKey.js';
import { ChatMember } from '../../../../Domain/Entities/ChatMember.js';
import { GroupRecord } from '../../../../Domain/Entities/GroupRecord.js';
import { ChatPrivileges } from '../../../../Domain/Enums/ChatPrivileges.js';
import { GroupLifecycle } from '../../../../Domain/Enums/GroupLifecycle.js';
import { generateEpochKey, generateWriteKeyPair } from '../../../../Infrastructure/Crypto/LedgerCodec.js';
import { ChatContract } from '../../../Contracts/Models/ChatContract.js';
import { ChatMemberContract } from '../../../Contracts/Models/ChatMemberContract.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { IGroupKeyRepository } from '../../../Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../../Contracts/Repositories/IGroupRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { CreateGroupCommand } from '../Contracts/CreateGroup.js';

/**
 * Creates the group locally only. The ledger stream is written when the first message is sent, the same
 * way a one to one chat only reaches the server once something is said in it.
 */
export class CreateGroupCommandHandler implements Handler<CreateGroupCommand, ChatContract> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly friendRepository: IFriendRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly groupRepository: IGroupRepository,
    ) { }

    public async handle(cmd: CreateGroupCommand): Promise<Result<ChatContract>> {
        if (cmd.memberTags.length === 0) {
            return Result.fail<ChatContract>(new ErrorMessage('CreateGroup', 'A group needs at least one other member.'));
        }

        const members: ChatMember[] = [];

        for (const tag of cmd.memberTags) {
            const friend = await this.friendRepository.getById(tag);
            if (!friend) return Result.fail<ChatContract>(new ErrorMessage('CreateGroup', `Unknown friend ${tag}`));

            members.push(ChatMember.create(uuid().toString(), ChatPrivileges.Member, friend));
        }

        const writeKey = generateWriteKeyPair();
        await this.groupKeyRepository.saveWriteKey(
            new GroupWriteKey(cmd.groupId, writeKey.publicKey, writeKey.privateKey),
        );
        await this.groupKeyRepository.saveEpochKey(new GroupEpochKey(cmd.groupId, 1, generateEpochKey()));

        await this.groupRepository.save(new GroupRecord(cmd.groupId, GroupLifecycle.Draft));

        const chat = new Chat(cmd.groupId, members, [], 0, false, cmd.groupId);
        chat.groupName = cmd.name;

        await this.chatStore.create(chat);

        return Result.success(this.mapToContract(chat));
    }

    private mapToContract(chat: Chat): ChatContract {
        return new ChatContract(
            chat.id,
            chat.groupId,
            chat.isGroup,
            chat.groupName,
            chat.members.map(
                (member) =>
                    new ChatMemberContract(
                        member.id,
                        member.friend?.id ?? null,
                        member.userTag,
                        member.privilege,
                        member.displayName ?? member.userTag,
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
