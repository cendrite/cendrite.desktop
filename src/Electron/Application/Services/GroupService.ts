import { v4 as uuid } from 'uuid';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { Group } from '#electron/Domain/Entities/Group';
import { PendingGroupStart } from '#electron/Domain/Entities/PendingGroupStart';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupMemberAddedEvent } from '#electron/Domain/Events/GroupMemberAddedEvent';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { GroupCreatedOperation, GroupMemberRef, MemberAddedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { generateEpochKey, generateWriteKeyPair } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { Envelope, GroupStrapPayload, GroupUpdatedPayload, Payload } from '#electron/Domain/Protocol/Payload';
import { IOutboxRepository } from '#electron/Infrastructure/Interfaces/IOutboxRepository';
import { IChatStore } from '../Contracts/Repositories/IChatStore.js';
import { IDeviceRepository } from '../Contracts/Repositories/IDeviceRepository.js';
import { IFriendRepository } from '../Contracts/Repositories/IFriendRepository.js';
import { IGroupKeyRepository } from '../Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../Contracts/Repositories/IUserRepository.js';
import { ILedgerSyncService } from '../Contracts/Services/ILedgerSyncService.js';
import { ILedgerWriter } from '../Contracts/Services/ILedgerWriter.js';
import { IMessageHubHandler, ServerMessage } from '../Contracts/Services/IMessageHubHandler.js';
import { ISessionManager, UntrustedDeviceError } from '../Contracts/Services/ISessionManager.js';

export interface IGroupService {
    createGroup(groupId: string): Promise<void>;
    startGroup(groupId: string): Promise<Result<Record<string, GroupStrapPayload> | null>>;
    addMember(groupId: string, friendId: string): Promise<Result>;
    deliverInvite(event: GroupMemberAddedEvent): Promise<boolean>;
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
        private readonly friendRepository: IFriendRepository,
        private readonly ledgerSyncService: ILedgerSyncService,
        private readonly eventRepository: IOutboxRepository,
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler,
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
            group.pendingStart = await this.prepareStart(group);
            await this.groupRepository.update(group);
        }

        const pending = group.pendingStart;

        const createStreamResult = await this.ledgerWriter.createStream(group.groupId, {
            payload: Buffer.from(pending.payload, 'base64'),
            signature: Buffer.from(pending.signature, 'base64'),
            hash: Buffer.from(pending.hash, 'base64'),
            invites: pending.invites,
        });

        if (!createStreamResult.success) return Result.fail<Record<string, GroupStrapPayload> | null>(createStreamResult.errorMessage);

        group.lifecycle = GroupLifecycle.Active;
        group.version = 1;
        group.headHash = Buffer.from(pending.hash, 'base64');
        group.pendingStart = null;
        await this.groupRepository.update(group);

        return Result.success<Record<string, GroupStrapPayload> | null>(pending.straps);
    }

    private async prepareStart(group: Group): Promise<PendingGroupStart> {
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
            new GroupCreatedOperation(user.userTag, chat.groupName, members),
        );

        if (!sealCreateResult.success) throw new Error(sealCreateResult.errorMessage.message);

        const hash = sealCreateResult.data.hash.toString('base64');
        const epochKeys = [epochKey.key.toString('base64')];
        const straps: Record<string, GroupStrapPayload> = {};

        for (const [connectionId, privateKey] of Object.entries(inviteKeys)) {
            straps[connectionId] = new GroupStrapPayload(group.groupId, chat.groupName, 1, hash, epochKeys, privateKey, members);
        }

        return new PendingGroupStart(
            straps,
            sealCreateResult.data.payload.toString('base64'),
            sealCreateResult.data.signature.toString('base64'),
            hash,
            sealCreateResult.data.invites,
        );
    }

    public async addMember(groupId: string, friendId: string): Promise<Result> {
        const group = await this.groupRepository.get(groupId);
        if (group?.lifecycle !== GroupLifecycle.Active) return refused('Send a message in the group before adding members');

        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey || writeKey.isInvite) return refused('This device cannot change the group yet');

        const friend = await this.friendRepository.getById(friendId);
        const devices = friend?.connectionIds.map((connection) => connection.connectionId) ?? [];
        if (!friend || devices.length === 0) return refused('This contact has no devices to invite');

        const syncResult = await this.ledgerSyncService.sync(groupId);
        if (!syncResult.success) return Result.fail(syncResult.errorMessage);

        const { state, halted, stalledAt } = syncResult.data;
        if (halted || stalledAt !== null) return refused('The group membership could not be verified');

        const { userTag } = await this.userRepository.get(true);
        const author = state.members.get(userTag);
        if (!author || author.privilege < ChatPrivileges.Admin) return refused('Only an owner or admin can add members');
        if (state.members.has(friend.id)) return refused('This contact is already in the group');

        const inviteKeys: Record<string, string> = {};
        const invitePublicKeys = devices.map((connectionId) => {
            const inviteKey = generateWriteKeyPair();
            inviteKeys[connectionId] = inviteKey.privateKey.toString('base64');
            return inviteKey.publicKey.toString('base64');
        });

        const operation = new MemberAddedOperation(
            userTag,
            new GroupMemberRef(
                friend.id,
                friend.displayName ?? friend.username,
                ChatPrivileges.Member,
                friend.avatarKey,
                [],
                invitePublicKeys,
                devices,
            ),
        );

        await this.eventRepository.appendEvent(new GroupMemberAddedEvent(uuid().toString(), groupId, operation, inviteKeys, new Date()));

        return Result.success();
    }

    public async deliverInvite(event: GroupMemberAddedEvent): Promise<boolean> {
        const syncResult = await this.ledgerSyncService.sync(event.groupId);
        if (!syncResult.success || syncResult.data.halted || syncResult.data.stalledAt !== null) return false;

        let state = syncResult.data.state;
        const target = event.operation.member;
        const existing = state.members.get(target.userTag);

        if (existing && !target.inviteKeys.some((key) => existing.inviteKeys.includes(key))) {
            await this.eventRepository.markAsFailed(event.id, 'The member is already in the group with other keys');
            return true;
        }

        if (!existing) {
            const appendResult = await this.ledgerWriter.append(event.groupId, event.operation);

            if (!appendResult.success) {
                if (appendResult.errorMessage.code !== 'Forbidden') return false;

                await this.eventRepository.markAsFailed(event.id, appendResult.errorMessage.message);
                return true;
            }

            const appendedSyncResult = await this.ledgerSyncService.sync(event.groupId);
            if (!appendedSyncResult.success || appendedSyncResult.data.halted || appendedSyncResult.data.stalledAt !== null) return false;

            state = appendedSyncResult.data.state;
        }

        if (!(await this.sendInvite(event, state))) return false;

        await this.eventRepository.deleteEvent(event.id);

        return true;
    }

    private async sendInvite(event: GroupMemberAddedEvent, state: GroupState): Promise<boolean> {
        const device = await this.deviceRepository.get();
        if (device === null) return false;

        const chat = await this.chatStore.getChatWithMembers(event.groupId);
        const user = await this.userRepository.get(true);
        const avatars = new Map<string, string | null>(chat.members.map((member) => [member.userTag, member.avatar]));
        avatars.set(user.userTag, user.avatarKey);
        avatars.set(event.operation.member.userTag, event.operation.member.avatarKey);

        const members = [...state.members.values()].map(
            (member) =>
                new GroupMemberRef(
                    member.userTag,
                    member.displayName,
                    member.privilege,
                    avatars.get(member.userTag) ?? null,
                    member.writeKeys,
                    member.inviteKeys,
                    member.connectionIds,
                ),
        );

        const epochKeys = (await this.groupKeyRepository.getEpochKeys(event.groupId))
            .sort((a, b) => a.epoch - b.epoch)
            .map((epochKey) => epochKey.key.toString('base64'));
        const headHash = Buffer.from(state.headHash).toString('base64');
        const messages: ServerMessage[] = [];

        for (const [connectionId, inviteKeyPrivate] of Object.entries(event.inviteKeys)) {
            const strap = new GroupStrapPayload(event.groupId, state.name, state.version, headHash, epochKeys, inviteKeyPrivate, members);
            await this.addMessage(messages, device.connectionId, connectionId, strap);
        }

        const update = new GroupUpdatedPayload(event.groupId, state.name, state.version, state.epoch, headHash);
        const otherDevices = members
            .filter((member) => member.userTag !== event.operation.member.userTag)
            .flatMap((member) => member.connectionIds)
            .filter((connectionId) => connectionId !== device.connectionId);

        for (const connectionId of otherDevices) {
            await this.addMessage(messages, device.connectionId, connectionId, update);
        }

        if (messages.length === 0) return true;

        return (await this.messageHubHandler.sendMessage(messages)) !== DeliveryStatus.Failed;
    }

    private async addMessage(messages: ServerMessage[], senderId: string, connectionId: string, payload: Payload): Promise<void> {
        try {
            const cipher = await this.sessionManager.encrypt(new Envelope([payload]), connectionId);
            messages.push(new ServerMessage(uuid().toString(), senderId, connectionId, cipher));
        } catch (error) {
            if (!(error instanceof UntrustedDeviceError)) throw error;
        }
    }
}

function refused(message: string): Result {
    return Result.fail(new ErrorMessage('Forbidden', message));
}
