import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { ILedgerProvider, LedgerEvent, LedgerKeyGrant, LedgerReadProof } from '#electron/Application/Contracts/Providers/ILedgerProvider';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IMediaStore } from '#electron/Application/Contracts/Repositories/IMediaStore';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { ILedgerLogRepository } from '#electron/Application/Contracts/Repositories/ILedgerLogRepository';
import { ILedgerReplayService, ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { ILedgerSyncService } from '#electron/Application/Contracts/Services/ILedgerSyncService';
import { ChatMember } from '#electron/Domain/Entities/ChatMember';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { LedgerEventRecord } from '#electron/Domain/Entities/LedgerEventRecord';
import { LedgerEventStatus } from '#electron/Domain/Enums/LedgerEventStatus';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { KeyGrant } from '#electron/Domain/Protocol/KeyChanges';
import { v4 as uuid } from 'uuid';
import { buildReadSigningInput, buildSigningInput, hashEvent, signOuter } from '../Crypto/LedgerCodec.js';

const PAGE_SIZE = 500;

export class LedgerSyncService implements ILedgerSyncService {
    constructor(
        private readonly ledgerProvider: ILedgerProvider,
        private readonly ledgerLogRepository: ILedgerLogRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly ledgerReplayService: ILedgerReplayService,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly chatStore: IChatStore,
        private readonly userRepository: IUserRepository,
        private readonly mainWindow: Electron.BrowserWindow,
        private readonly mediaStore: IMediaStore,
        private readonly eventRepository: IOutboxRepository,
    ) { }

    public async sync(groupId: string): Promise<Result<ReplayResult>> {
        const fetched = await this.fetchNewEvents(groupId);
        if (!fetched.success) return Result.fail<ReplayResult>(fetched.errorMessage);

        const events = await this.ledgerLogRepository.getAll(groupId);
        const replayed = await this.ledgerReplayService.replay(groupId, events);

        await this.recordOutcome(groupId, replayed, fetched.data);

        return Result.success(replayed);
    }

    private async fetchNewEvents(groupId: string): Promise<Result<boolean>> {
        const writeKey = await this.groupKeyRepository.getWriteKey(groupId);
        if (!writeKey) return Result.fail<boolean>(new ErrorMessage('LedgerSyncService', `No write key for group ${groupId}`));

        let fromVersion = (await this.ledgerLogRepository.getLastVersion(groupId)) + 1;
        let archived = false;
        let hasMore = true;

        while (hasMore) {
            const page = await this.ledgerProvider.getEvents(groupId, fromVersion, readProof(groupId, writeKey), PAGE_SIZE);
            if (!page.success) return Result.fail<boolean>(page.errorMessage);

            const { events } = page.data;
            archived = page.data.archived;

            await this.ledgerLogRepository.append(events.map((event) => toRecord(groupId, event)));

            hasMore = page.data.hasMore && events.length > 0;

            if (hasMore) fromVersion = events[events.length - 1].version + 1;
        }

        return Result.success(archived);
    }

    private async recordOutcome(groupId: string, replayed: ReplayResult, archived: boolean): Promise<void> {
        const group = (await this.groupRepository.get(groupId)) ?? new Group(groupId);

        group.version = replayed.state.version;
        group.headHash = replayed.state.headHash;
        group.epoch = replayed.state.epoch;
        group.archived = archived;

        const trusted = replayed.halted === null && replayed.stalledAt === null;
        const { userTag } = await this.userRepository.get(true);

        if (trusted && replayed.state.removed.has(userTag)) {
            await this.wipeGroup(group);
            return;
        }

        const privilege = trusted ? replayed.state.members.get(userTag)?.privilege : undefined;
        const privilegeChanged = privilege !== undefined && privilege !== group.privilege;
        if (privilegeChanged) group.privilege = privilege;

        await this.groupRepository.create(group);

        for (const rejected of replayed.rejected) {
            await this.ledgerLogRepository.setStatus(
                groupId,
                rejected.version,
                LedgerEventStatus.Rejected,
                rejected.reason,
            );
        }

        for (const verified of replayed.verified) {
            await this.ledgerLogRepository.setVerifiedAuthor(groupId, verified.version, verified.userTag);
        }

        if (replayed.stalledAt !== null) {
            await this.ledgerLogRepository.setStatus(groupId, replayed.stalledAt, LedgerEventStatus.Stalled);
        }

        const chatChanged = trusted && (await this.syncChat(groupId, replayed.state, userTag));

        if ((chatChanged || privilegeChanged) && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('eventMessage', { kind: 'groupChanged', groupId });
        }
    }

    private async wipeGroup(group: Group): Promise<void> {
        const groupId = group.groupId;
        const mediaIds = await this.chatStore.getMediaIds(groupId);

        await Promise.allSettled(mediaIds.map((mediaId) => this.mediaStore.delete(mediaId)));
        await this.chatStore.deleteChat(groupId);
        await this.eventRepository.deleteForGroup(groupId);
        await this.ledgerLogRepository.deleteForGroup(groupId);
        await this.groupKeyRepository.deleteForGroup(groupId);
        await this.groupRepository.create(new Group(groupId, GroupLifecycle.Left));

        if (!this.mainWindow.isDestroyed()) this.mainWindow.webContents.send('eventMessage', { kind: 'groupRemoved', groupId });
    }

    private async syncChat(groupId: string, state: GroupState, userTag: string): Promise<boolean> {
        if (state.members.size === 0 || !(await this.chatStore.getChat(groupId))) return false;

        const chat = await this.chatStore.getChatWithMembers(groupId);
        const known = new Set(chat.members.map((member) => member.userTag));
        const missing = [...state.members.values()].filter((member) => member.userTag !== userTag && !known.has(member.userTag));
        const name = state.name ?? null;
        const renamed = name !== (chat.groupName ?? null);

        const changedPrivileges = chat.members.flatMap((member) => {
            const privilege = state.members.get(member.userTag)?.privilege;
            return privilege !== undefined && privilege !== member.privilege ? [{ memberId: member.id, privilege }] : [];
        });

        const removedIds = chat.members.filter((member) => member.userTag && !state.members.has(member.userTag)).map((member) => member.id);

        const changedDevices = chat.members.flatMap((member) => {
            const connectionIds = state.members.get(member.userTag)?.connectionIds;
            if (!connectionIds || !member.connectionIds) return [];

            const unchanged = connectionIds.length === member.connectionIds.length && connectionIds.every((id) => member.connectionIds!.includes(id));
            return unchanged ? [] : [{ memberId: member.id, connectionIds }];
        });

        if (missing.length === 0 && !renamed && changedPrivileges.length === 0 && removedIds.length === 0 && changedDevices.length === 0) return false;

        await this.chatStore.removeMembers(removedIds);

        if (missing.length > 0) {
            await this.chatStore.addMembers(
                groupId,
                missing.map((member) =>
                    ChatMember.createExternal(uuid().toString(), member.privilege, member.userTag, member.displayName, member.connectionIds),
                ),
            );
        }

        if (renamed) await this.chatStore.setGroupName(groupId, name);

        for (const { memberId, privilege } of changedPrivileges) {
            await this.chatStore.setMemberPrivilege(memberId, privilege);
        }

        for (const { memberId, connectionIds } of changedDevices) {
            await this.chatStore.setMemberDevices(memberId, connectionIds);
        }

        return true;
    }
}

function toRecord(groupId: string, event: LedgerEvent): LedgerEventRecord {
    const hash = hashEvent(
        buildSigningInput({
            groupId,
            version: event.version,
            previousHash: event.previousHash,
            payload: event.payload,
            keysAdded: event.keysAdded,
            invitesAdded: event.invitesAdded,
            keysRemoved: event.keysRemoved,
            rolesChanged: event.rolesChanged,
        }),
    );

    return new LedgerEventRecord(
        groupId,
        event.version,
        event.previousHash,
        event.payload,
        event.writeKeyPublic,
        event.signature,
        hash,
        event.keysAdded.map((key) => key.toString('base64')),
        event.invitesAdded.map(toStoredGrant),
        event.keysRemoved.map((key) => key.toString('base64')),
        event.rolesChanged.map(toStoredGrant),
    );
}

function toStoredGrant(grant: LedgerKeyGrant): KeyGrant {
    return { publicKey: grant.publicKey.toString('base64'), role: grant.role };
}

export function readProof(groupId: string, writeKey: GroupWriteKey): LedgerReadProof {
    const timestamp = Math.floor(Date.now() / 1000);

    return {
        writeKeyPublic: writeKey.publicKey,
        timestamp,
        signature: signOuter(writeKey.privateKey, buildReadSigningInput(groupId, timestamp)),
    };
}
