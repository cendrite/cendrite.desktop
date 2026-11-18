import { Result } from '#shared/Result/Result';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { Group } from '#electron/Domain/Entities/Group';
import { PendingGroupStart } from '#electron/Domain/Entities/PendingGroupStart';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupCreatedOperation, GroupMemberRef } from '#electron/Domain/Protocol/LedgerOperation';
import { generateEpochKey, generateWriteKeyPair, publicKeyFromPrivate } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { GroupStrapPayload } from '#electron/Domain/Protocol/Payload';
import { IChatStore } from '../Contracts/Repositories/IChatStore.js';
import { IDeviceRepository } from '../Contracts/Repositories/IDeviceRepository.js';
import { IGroupKeyRepository } from '../Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../Contracts/Repositories/IUserRepository.js';
import { ILedgerWriter } from '../Contracts/Services/ILedgerWriter.js';

export interface IGroupService {
    createGroup(groupId: string): Promise<void>;
    startGroup(groupId: string): Promise<Result<Record<string, GroupStrapPayload> | null>>;
}

export class GroupService implements IGroupService {
    private readonly starting = new Map<string, Promise<Result<Record<string, GroupStrapPayload> | null>>>();

    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly chatStore: IChatStore,
        private readonly ledgerWriter: ILedgerWriter,
    ) { }

    public async createGroup(groupId: string): Promise<void> {
        const writeKey = generateWriteKeyPair();

        await this.groupKeyRepository.saveWriteKey(new GroupWriteKey(groupId, writeKey.publicKey, writeKey.privateKey));
        await this.groupKeyRepository.saveEpochKey(new GroupEpochKey(groupId, 1, generateEpochKey()));
        await this.groupRepository.create(new Group(groupId));
    }

    public startGroup(groupId: string): Promise<Result<Record<string, GroupStrapPayload> | null>> {
        const inFlight = this.starting.get(groupId);
        if (inFlight) return inFlight.then((result) => (result.success ? Result.success(null) : result));

        const start = this.start(groupId).finally(() => this.starting.delete(groupId));
        this.starting.set(groupId, start);

        return start;
    }

    private async start(groupId: string): Promise<Result<Record<string, GroupStrapPayload> | null>> {
        const group = await this.groupRepository.get(groupId);

        if (!group) throw new Error(`Group with ID ${groupId} not found`);

        if (group.lifecycle !== GroupLifecycle.Draft) return Result.success(null);

        if (!group.pendingStart) {
            const prepareStartResult = await this.prepareStart(group);
            if (!prepareStartResult.success) return Result.fail<Record<string, GroupStrapPayload> | null>(prepareStartResult.errorMessage);

            group.pendingStart = prepareStartResult.data;
            await this.groupRepository.update(group);
        }

        const pending = group.pendingStart;

        const createStreamResult = await this.ledgerWriter.createStream(
            group.groupId,
            Object.values(pending.straps).map((strap) => publicKeyFromPrivate(Buffer.from(strap.inviteKeyPrivate, 'base64'))),
            {
                payload: Buffer.from(pending.payload, 'base64'),
                signature: Buffer.from(pending.signature, 'base64'),
                hash: Buffer.from(pending.hash, 'base64'),
            },
        );

        if (!createStreamResult.success) return Result.fail<Record<string, GroupStrapPayload> | null>(createStreamResult.errorMessage);

        group.lifecycle = GroupLifecycle.Active;
        group.version = 1;
        group.headHash = Buffer.from(pending.hash, 'base64');
        group.pendingStart = null;
        await this.groupRepository.update(group);

        return Result.success<Record<string, GroupStrapPayload> | null>(pending.straps);
    }

    private async prepareStart(group: Group): Promise<Result<PendingGroupStart>> {
        const chat = await this.chatStore.getChatWithMembers(group.groupId);
        const user = await this.userRepository.get(true);
        const device = await this.deviceRepository.get();

        if (device === null) throw new Error('Device not found');

        const ownWriteKey = await this.groupKeyRepository.getWriteKey(group.groupId);
        const epochKey = await this.groupKeyRepository.getEpochKey(group.groupId, group.epoch);
        if (!ownWriteKey || !epochKey) throw new Error(`Group ${group.groupId} has no keys`);

        const inviteKeys: Record<string, string> = {};

        const mintInviteKeys = (connectionIds: string[]): string[] =>
            connectionIds.map((connectionId) => {
                const inviteKey = generateWriteKeyPair();
                inviteKeys[connectionId] = inviteKey.privateKey.toString('base64');
                return inviteKey.publicKey.toString('base64');
            });

        const ownConnectionIds = [...new Set([device.connectionId, ...(user.connectionIds ?? []).map((c) => c.connectionId)])];

        const members: GroupMemberRef[] = [
            new GroupMemberRef(
                user.userTag,
                user.displayName ?? user.username,
                ChatPrivileges.Owner,
                user.avatarKey,
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
                    [],
                    mintInviteKeys(member.devices),
                    member.devices,
                ),
            );
        }

        const sealCreateResult = await this.ledgerWriter.sealCreate(
            group.groupId,
            Object.values(inviteKeys).map((privateKey) => publicKeyFromPrivate(Buffer.from(privateKey, 'base64'))),
            new GroupCreatedOperation(user.userTag, chat.groupName, members),
        );

        if (!sealCreateResult.success) return Result.fail<PendingGroupStart>(sealCreateResult.errorMessage);

        const hash = sealCreateResult.data.hash.toString('base64');
        const epochKeys = [epochKey.key.toString('base64')];
        const straps: Record<string, GroupStrapPayload> = {};

        for (const [connectionId, privateKey] of Object.entries(inviteKeys)) {
            straps[connectionId] = new GroupStrapPayload(group.groupId, chat.groupName, 1, hash, epochKeys, privateKey, members);
        }

        return Result.success(
            new PendingGroupStart(
                straps,
                sealCreateResult.data.payload.toString('base64'),
                sealCreateResult.data.signature.toString('base64'),
                hash,
            ),
        );
    }
}
