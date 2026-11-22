import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { ILedgerProvider, LedgerEvent, LedgerKeyGrant, LedgerReadProof } from '#electron/Application/Contracts/Providers/ILedgerProvider';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { ILedgerLogRepository } from '#electron/Application/Contracts/Repositories/ILedgerLogRepository';
import { ILedgerReplayService, ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { ILedgerSyncService } from '#electron/Application/Contracts/Services/ILedgerSyncService';
import { ChatMember } from '#electron/Domain/Entities/ChatMember';
import { Group } from '#electron/Domain/Entities/Group';
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

        if (replayed.halted === null && replayed.stalledAt === null) await this.syncChatMembers(groupId, replayed.state);
    }

    private async syncChatMembers(groupId: string, state: GroupState): Promise<void> {
        if (state.members.size === 0 || !(await this.chatStore.getChat(groupId))) return;

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

function readProof(groupId: string, writeKey: GroupWriteKey): LedgerReadProof {
    const timestamp = Math.floor(Date.now() / 1000);

    return {
        writeKeyPublic: writeKey.publicKey,
        timestamp,
        signature: signOuter(writeKey.privateKey, buildReadSigningInput(groupId, timestamp)),
    };
}
