import { v4 as uuid } from 'uuid';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { GROUP_NAME_MAX_LENGTH } from '#shared/Chat/RenameGroup';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { Group } from '#electron/Domain/Entities/Group';
import { PendingGroupStart } from '#electron/Domain/Entities/PendingGroupStart';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupChangeEvent } from '#electron/Domain/Events/GroupChangeEvent';
import { ChatMember } from '#electron/Domain/Entities/ChatMember';
import { LedgerOperationType } from '#electron/Domain/Enums/LedgerOperationType';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { GroupCreatedOperation, GroupMemberRef, LedgerOperation, MemberAddedOperation, MemberRemovedOperation, PrivilegeChangedOperation, SettingsChangedOperation } from '#electron/Domain/Protocol/LedgerOperation';
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
    renameGroup(groupId: string, name: string): Promise<Result>;
    changeMemberPrivilege(groupId: string, userTag: string, privilege: ChatPrivileges): Promise<Result>;
    removeMember(groupId: string, userTag: string): Promise<Result>;
    deliverChange(change: GroupChangeEvent): Promise<boolean>;
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
        private readonly mainWindow: Electron.BrowserWindow,
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
        group.privilege = ChatPrivileges.Owner;
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
                    member.privilege,
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
        if (group?.lifecycle !== GroupLifecycle.Draft && group?.lifecycle !== GroupLifecycle.Active) return refused('This group cannot be changed');

        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey || writeKey.isInvite) return refused('This device cannot change the group yet');

        const friend = await this.friendRepository.getById(friendId);
        const devices = friend?.connectionIds.map((connection) => connection.connectionId) ?? [];
        if (!friend || devices.length === 0) return refused('This contact has no devices to invite');

        const { userTag } = await this.userRepository.get(true);
        const allowed = await this.mayAddMember(group, userTag, friend.id);
        if (!allowed.success) return allowed;

        if (group.lifecycle === GroupLifecycle.Draft && !group.pendingStart) {
            await this.chatStore.addMembers(groupId, [ChatMember.create(uuid().toString(), ChatPrivileges.Member, friend)]);
            this.announceGroupChanged(groupId);
            return Result.success();
        }

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

        await this.eventRepository.appendEvent(new GroupChangeEvent(uuid().toString(), groupId, operation, inviteKeys, new Date()));

        return Result.success();
    }

    public async renameGroup(groupId: string, name: string): Promise<Result> {
        const trimmed = name.trim();
        if (trimmed.length === 0) return refused('Enter a group name');
        if (trimmed.length > GROUP_NAME_MAX_LENGTH) return refused(`Name can be at most ${GROUP_NAME_MAX_LENGTH} characters`);

        const group = await this.groupRepository.get(groupId);
        if (group?.lifecycle !== GroupLifecycle.Draft && group?.lifecycle !== GroupLifecycle.Active) return refused('This group cannot be changed');

        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey || writeKey.isInvite) return refused('This device cannot change the group yet');

        if (group.lifecycle === GroupLifecycle.Draft && !group.pendingStart) {
            await this.chatStore.setGroupName(groupId, trimmed);
            this.announceGroupChanged(groupId);
            return Result.success();
        }

        const { userTag } = await this.userRepository.get(true);

        if (group.lifecycle === GroupLifecycle.Active) {
            const adminStateResult = await this.adminState(groupId, userTag, 'Only an owner or admin can rename the group');
            if (!adminStateResult.success) return adminStateResult;
        }

        const operation = new SettingsChangedOperation(userTag, trimmed, null);
        await this.eventRepository.appendEvent(new GroupChangeEvent(uuid().toString(), groupId, operation, {}, new Date()));

        return Result.success();
    }

    public async changeMemberPrivilege(groupId: string, targetTag: string, privilege: ChatPrivileges): Promise<Result> {
        if (privilege !== ChatPrivileges.Member && privilege !== ChatPrivileges.Admin) return refused('A member can only be made a member or an admin');

        const group = await this.groupRepository.get(groupId);
        if (group?.lifecycle !== GroupLifecycle.Draft && group?.lifecycle !== GroupLifecycle.Active) return refused('This group cannot be changed');

        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey || writeKey.isInvite) return refused('This device cannot change the group yet');

        const { userTag } = await this.userRepository.get(true);
        if (targetTag === userTag) return refused('You cannot change your own role');

        if (group.lifecycle === GroupLifecycle.Draft) {
            const chat = await this.chatStore.getChatWithMembers(groupId);
            const member = chat.members.find((candidate) => candidate.userTag === targetTag);
            if (!member) return refused('This person is not in the group');

            if (!group.pendingStart) {
                await this.chatStore.setMemberPrivilege(member.id, privilege);
                this.announceGroupChanged(groupId);
                return Result.success();
            }
        } else {
            const ownerStateResult = await this.adminState(groupId, userTag, 'Only the owner can change roles', ChatPrivileges.Owner);
            if (!ownerStateResult.success) return ownerStateResult;

            const target = ownerStateResult.data.members.get(targetTag);
            if (!target) return refused('This person is not in the group');
            if (target.privilege === ChatPrivileges.Owner) return refused('The owner\'s role cannot be changed');
        }

        const operation = new PrivilegeChangedOperation(userTag, targetTag, privilege);
        await this.eventRepository.appendEvent(new GroupChangeEvent(uuid().toString(), groupId, operation, {}, new Date()));

        return Result.success();
    }

    public async removeMember(groupId: string, targetTag: string): Promise<Result> {
        const group = await this.groupRepository.get(groupId);
        if (group?.lifecycle !== GroupLifecycle.Draft && group?.lifecycle !== GroupLifecycle.Active) return refused('This group cannot be changed');

        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey || writeKey.isInvite) return refused('This device cannot change the group yet');

        const { userTag } = await this.userRepository.get(true);
        if (targetTag === userTag) return refused('You cannot remove yourself');

        let devices: string[];

        if (group.lifecycle === GroupLifecycle.Draft) {
            const chat = await this.chatStore.getChatWithMembers(groupId);
            const member = chat.members.find((candidate) => candidate.userTag === targetTag);
            if (!member) return refused('This person is not in the group');

            if (!group.pendingStart) {
                await this.chatStore.removeMembers([member.id]);
                this.announceGroupChanged(groupId);
                return Result.success();
            }

            devices = member.devices;
        } else {
            const adminStateResult = await this.adminState(groupId, userTag, 'Only an owner or admin can remove members');
            if (!adminStateResult.success) return adminStateResult;

            const author = adminStateResult.data.members.get(userTag)!;
            const target = adminStateResult.data.members.get(targetTag);
            if (!target) return refused('This person is not in the group');
            if (author.privilege <= target.privilege) return refused('You can only remove members below your own role');

            devices = target.connectionIds;
        }

        const operation = new MemberRemovedOperation(userTag, targetTag);
        await this.eventRepository.appendEvent(new GroupChangeEvent(uuid().toString(), groupId, operation, {}, new Date(), devices));

        return Result.success();
    }

    public async deliverChange(change: GroupChangeEvent): Promise<boolean> {
        const group = await this.groupRepository.get(change.groupId);
        if (group?.lifecycle !== GroupLifecycle.Active) return false;

        const syncResult = await this.ledgerSyncService.sync(change.groupId);
        if (!syncResult.success || syncResult.data.halted || syncResult.data.stalledAt !== null) return false;

        let state = syncResult.data.state;
        const status = changeStatus(state, change.operation);

        if (status === 'conflict') {
            await this.eventRepository.deleteEvent(change.id);
            return true;
        }

        if (status === 'pending') {
            const appendResult = await this.ledgerWriter.append(change.groupId, change.operation);

            if (!appendResult.success) {
                if (appendResult.errorMessage.code !== 'Forbidden') return false;

                await this.eventRepository.markAsFailed(change.id, appendResult.errorMessage.message);
                return true;
            }

            const appendedSyncResult = await this.ledgerSyncService.sync(change.groupId);
            if (!appendedSyncResult.success || appendedSyncResult.data.halted || appendedSyncResult.data.stalledAt !== null) return false;

            state = appendedSyncResult.data.state;
        }

        if (!(await this.sendChange(change, state))) return false;

        await this.eventRepository.deleteEvent(change.id);

        return true;
    }

    private async mayAddMember(group: Group, userTag: string, friendId: string): Promise<Result> {
        if (group.lifecycle === GroupLifecycle.Draft) {
            const chat = await this.chatStore.getChatWithMembers(group.groupId);
            return chat.members.some((member) => member.userTag === friendId) ? refused('This contact is already in the group') : Result.success();
        }

        const adminStateResult = await this.adminState(group.groupId, userTag, 'Only an owner or admin can add members');
        if (!adminStateResult.success) return adminStateResult;
        if (adminStateResult.data.members.has(friendId)) return refused('This contact is already in the group');

        return Result.success();
    }

    private async adminState(groupId: string, userTag: string, notAdminMessage: string, required: ChatPrivileges = ChatPrivileges.Admin): Promise<Result<GroupState>> {
        const syncResult = await this.ledgerSyncService.sync(groupId);
        if (!syncResult.success) return Result.fail<GroupState>(syncResult.errorMessage);

        const { state, halted, stalledAt } = syncResult.data;
        if (halted || stalledAt !== null) return Result.fail<GroupState>(new ErrorMessage('Forbidden', 'The group membership could not be verified'));

        const author = state.members.get(userTag);
        if (!author || author.privilege < required) return Result.fail<GroupState>(new ErrorMessage('Forbidden', notAdminMessage));

        return Result.success(state);
    }

    private async sendChange(change: GroupChangeEvent, state: GroupState): Promise<boolean> {
        const device = await this.deviceRepository.get();
        if (device === null) return false;

        const chat = await this.chatStore.getChatWithMembers(change.groupId);
        const user = await this.userRepository.get(true);
        const avatars = new Map<string, string | null>(chat.members.map((member) => [member.userTag, member.avatar]));
        avatars.set(user.userTag, user.avatarKey);
        if (change.operation.type === LedgerOperationType.MemberAdded) {
            avatars.set(change.operation.member.userTag, change.operation.member.avatarKey);
        }

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

        const epochKeys = (await this.groupKeyRepository.getEpochKeys(change.groupId))
            .sort((a, b) => a.epoch - b.epoch)
            .map((epochKey) => epochKey.key.toString('base64'));
        const headHash = Buffer.from(state.headHash).toString('base64');
        const messages: ServerMessage[] = [];

        for (const [connectionId, inviteKeyPrivate] of Object.entries(change.inviteKeys)) {
            const strap = new GroupStrapPayload(change.groupId, state.name, state.version, headHash, epochKeys, inviteKeyPrivate, members);
            await this.addMessage(messages, device.connectionId, connectionId, strap);
        }

        const update = new GroupUpdatedPayload(change.groupId, state.name, state.version, state.epoch, headHash);
        const otherDevices = [...new Set([...members.flatMap((member) => member.connectionIds), ...change.alsoNotify])]
            .filter((connectionId) => connectionId !== device.connectionId && !(connectionId in change.inviteKeys));

        for (const connectionId of otherDevices) {
            await this.addMessage(messages, device.connectionId, connectionId, update);
        }

        if (messages.length === 0) return true;

        return (await this.messageHubHandler.sendMessage(messages)) !== DeliveryStatus.Failed;
    }

    private announceGroupChanged(groupId: string): void {
        if (!this.mainWindow.isDestroyed()) this.mainWindow.webContents.send('eventMessage', { kind: 'groupChanged', groupId });
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

function changeStatus(state: GroupState, operation: LedgerOperation): 'pending' | 'applied' | 'conflict' {
    switch (operation.type) {
        case LedgerOperationType.MemberAdded: {
            const existing = state.members.get(operation.member.userTag);
            if (!existing) return 'pending';
            return operation.member.inviteKeys.some((key) => existing.inviteKeys.includes(key)) ? 'applied' : 'conflict';
        }
        case LedgerOperationType.SettingsChanged: {
            const nameApplied = operation.name === null || state.name === operation.name;
            const ttlApplied = operation.messageTtl === null || state.messageTtl === operation.messageTtl;
            return nameApplied && ttlApplied ? 'applied' : 'pending';
        }
        case LedgerOperationType.MemberRemoved:
            return state.members.has(operation.userTag) ? 'pending' : 'applied';
        case LedgerOperationType.PrivilegeChanged: {
            const member = state.members.get(operation.userTag);
            if (!member) return 'conflict';
            return member.privilege === operation.privilege ? 'applied' : 'pending';
        }
        default:
            return 'pending';
    }
}

function refused(message: string): Result {
    return Result.fail(new ErrorMessage('Forbidden', message));
}
