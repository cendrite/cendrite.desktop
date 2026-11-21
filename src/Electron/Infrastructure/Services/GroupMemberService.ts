import { v4 as uuid } from 'uuid';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IDeviceRepository } from '#electron/Application/Contracts/Repositories/IDeviceRepository';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { IGroupMemberService } from '#electron/Application/Contracts/Services/IGroupMemberService';
import { ILedgerSyncService } from '#electron/Application/Contracts/Services/ILedgerSyncService';
import { ILedgerWriter } from '#electron/Application/Contracts/Services/ILedgerWriter';
import { IMessageHubHandler, ServerMessage } from '#electron/Application/Contracts/Services/IMessageHubHandler';
import { ISessionManager, UntrustedDeviceError } from '#electron/Application/Contracts/Services/ISessionManager';
import { ChatMember } from '#electron/Domain/Entities/ChatMember';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupMemberAddedEvent } from '#electron/Domain/Events/GroupMemberAddedEvent';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { GroupMemberRef, MemberAddedOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { Envelope, GroupStrapPayload, GroupUpdatedPayload, Payload } from '#electron/Domain/Protocol/Payload';
import { generateWriteKeyPair } from '../Crypto/LedgerCodec.js';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';

const MAX_PENDING_INVITES = 50;

export class GroupMemberService implements IGroupMemberService {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly friendRepository: IFriendRepository,
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly ledgerSyncService: ILedgerSyncService,
        private readonly ledgerWriter: ILedgerWriter,
        private readonly eventRepository: IOutboxRepository,
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly mainWindow: Electron.BrowserWindow,
    ) { }

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

    public async reconcile(groupId: string, state: GroupState): Promise<void> {
        const latest = await this.deliverInvites(groupId, state);
        await this.addMissingChatMembers(groupId, latest);
    }

    private async deliverInvites(groupId: string, state: GroupState): Promise<GroupState> {
        const pending = await this.eventRepository.getEvents<GroupMemberAddedEvent>(GroupMemberAddedEvent.type, MAX_PENDING_INVITES);
        let latest = state;

        for (const event of pending.filter((candidate) => candidate.groupId === groupId)) {
            const target = event.operation.member;
            const existing = latest.members.get(target.userTag);

            if (existing && !target.inviteKeys.some((key) => existing.inviteKeys.includes(key))) {
                await this.eventRepository.markAsFailed(event.id, 'The member is already in the group with other keys');
                continue;
            }

            if (!existing) {
                const appendResult = await this.ledgerWriter.append(groupId, event.operation);

                if (!appendResult.success) {
                    if (appendResult.errorMessage.code === 'Forbidden') {
                        await this.eventRepository.markAsFailed(event.id, appendResult.errorMessage.message);
                        continue;
                    }
                    return latest;
                }

                const syncResult = await this.ledgerSyncService.sync(groupId);
                if (!syncResult.success || syncResult.data.halted || syncResult.data.stalledAt !== null) return latest;
                latest = syncResult.data.state;
            }

            if (!(await this.sendInvite(event, latest))) return latest;

            await this.eventRepository.deleteEvent(event.id);
        }

        return latest;
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

        try {
            return (await this.messageHubHandler.sendMessage(messages)) !== DeliveryStatus.Failed;
        } catch (error) {
            console.error(`GroupMemberService: could not send the invite for group ${event.groupId}`, error);
            return false;
        }
    }

    private async addMessage(messages: ServerMessage[], senderId: string, connectionId: string, payload: Payload): Promise<void> {
        try {
            const cipher = await this.sessionManager.encrypt(new Envelope([payload]), connectionId);
            messages.push(new ServerMessage(uuid().toString(), senderId, connectionId, cipher));
        } catch (error) {
            if (!(error instanceof UntrustedDeviceError)) throw error;
        }
    }

    private async addMissingChatMembers(groupId: string, state: GroupState): Promise<void> {
        if (!(await this.chatStore.getChat(groupId))) return;

        const chat = await this.chatStore.getChatWithMembers(groupId);
        const { userTag } = await this.userRepository.get(true);
        const known = new Set(chat.members.map((member) => member.userTag));
        const missing = [...state.members.values()].filter((member) => member.userTag !== userTag && !known.has(member.userTag));

        if (missing.length === 0) return;

        chat.members.push(
            ...missing.map((member) =>
                ChatMember.createExternal(uuid().toString(), member.privilege, member.userTag, member.displayName, member.connectionIds),
            ),
        );
        await this.chatStore.create(chat);

        if (!this.mainWindow.isDestroyed()) this.mainWindow.webContents.send('eventMessage', { kind: 'groupChanged', groupId });
    }
}

function refused(message: string): Result {
    return Result.fail(new ErrorMessage('Forbidden', message));
}
