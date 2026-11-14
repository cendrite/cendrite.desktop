import { Result } from '#shared/Result/Result';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { Group } from '#electron/Domain/Entities/Group';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupCreatedOperation, GroupMemberRef } from '#electron/Domain/Protocol/LedgerOperation';
import { generateEpochKey, generateWriteKeyPair, WriteKeyPair } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { ILedgerIdentity } from '#electron/Infrastructure/Interfaces/ILedgerIdentity';
import { GroupStrapPayload, Payload } from '#electron/Domain/Protocol/Payload';
import { IChatStore } from '../Contracts/Repositories/IChatStore.js';
import { IDeviceRepository } from '../Contracts/Repositories/IDeviceRepository.js';
import { IGroupKeyRepository } from '../Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../Contracts/Repositories/IUserRepository.js';
import { ILedgerWriter } from '../Contracts/Services/ILedgerWriter.js';

export interface IGroupService {
    createGroup(groupId: string): Promise<void>;
    startGroup(groupId: string): Promise<Result<Record<string, Payload[]> | null>>;
}

export class GroupService implements IGroupService {
    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly chatStore: IChatStore,
        private readonly ledgerWriter: ILedgerWriter,
        private readonly ledgerIdentity: ILedgerIdentity
    ) { }

    public async createGroup(groupId: string): Promise<void> {
        const writeKey = generateWriteKeyPair();

        await this.groupKeyRepository.saveWriteKey(new GroupWriteKey(groupId, writeKey.publicKey, writeKey.privateKey));
        await this.groupKeyRepository.saveEpochKey(new GroupEpochKey(groupId, 1, generateEpochKey()));
        await this.groupRepository.create(new Group(groupId));
    }

    public async startGroup(groupId: string): Promise<Result<Record<string, Payload[]> | null>> {
        const group = await this.groupRepository.get(groupId);

        if (!group) throw new Error(`Group with ID ${groupId} not found`);

        if (group.lifecycle !== GroupLifecycle.Draft) return Result.success(null);

        const chat = await this.chatStore.getChatWithMembers(groupId);
        const user = await this.userRepository.get(true);
        const device = await this.deviceRepository.get();

        if(device === null) throw new Error('Device not found');

        const ownWriteKey = await this.groupKeyRepository.getWriteKey(group.groupId);
        const epochKey = await this.groupKeyRepository.getEpochKey(group.groupId, group.epoch);

        if (!ownWriteKey || !epochKey) {
            throw new Error(`Group ${group.groupId} has no keys`);
        }

        const inviteKeys = new Map<string, WriteKeyPair>();

        const mintInviteKeys = (connectionIds: string[]): string[] =>
            connectionIds.map((connectionId) => {
                const inviteKey = generateWriteKeyPair();
                inviteKeys.set(connectionId, inviteKey);
                return inviteKey.publicKey.toString('base64');
            });

        const ownConnectionIds = [...new Set([device.connectionId, ...(user.connectionIds ?? []).map((c) => c.connectionId)])];

        const members: GroupMemberRef[] = [
            new GroupMemberRef(
                user.userTag,
                user.displayName ?? user.username,
                ChatPrivileges.Owner,
                user.avatarKey,
                (await this.ledgerIdentity.publicKey()).toString('base64'),
                [ownWriteKey.publicKey.toString('base64')],
                mintInviteKeys(ownConnectionIds.filter((connectionId) => connectionId !== device.connectionId)),
                ownConnectionIds,
            ),
        ];

        for (const member of chat.members) {
            members.push(
                new GroupMemberRef(
                    member.userTag,
                    member.displayName,
                    ChatPrivileges.Member,
                    member.friend!.avatarKey,
                    '',
                    [],
                    mintInviteKeys(member.devices),
                    member.devices,
                ),
            );
        }

        const created = await this.ledgerWriter.createStream(
            group.groupId,
            [...inviteKeys.values()].map((inviteKey) => inviteKey.publicKey),
            new GroupCreatedOperation(user.userTag, chat.groupName, members),
        );

        if (!created.success) {
            return Result.fail<Record<string, Payload[]> | null>(
                created.errorMessage,
            );
        }

        const payloads: Record<string, Payload[]> = {};
        const headHash = created.data.toString('base64');
        const epochKeys = [epochKey.key.toString('base64')];

        for (const [connectionId, inviteKey] of inviteKeys) {
            payloads[connectionId] = [
                new GroupStrapPayload(
                    group.groupId,
                    chat.groupName,
                    1,
                    headHash,
                    epochKeys,
                    inviteKey.privateKey.toString('base64'),
                    members,
                ),
            ];
        }

        group.lifecycle = GroupLifecycle.Active;
        await this.groupRepository.update(group);

        return Result.success<Record<string, Payload[]> | null>(payloads);
    }
}
