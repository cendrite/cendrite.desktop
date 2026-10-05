import { v4 as uuid } from 'uuid';
import { BrowserWindow } from 'electron';
import {
    GroupInvitePayload,
    GroupWriteKeyOfferPayload,
    LedgerAdvancedPayload,
    PayloadType,
} from '../../Application/Contracts/Messaging/Envelope.js';
import { IGroupInviteService } from '../../Application/Contracts/Services/IGroupInviteService.js';
import { ILedgerSyncService } from '../../Application/Contracts/Services/ILedgerSyncService.js';
import { IChatStore } from '../../Application/Contracts/Repositories/IChatStore.js';
import { IGroupKeyRepository } from '../../Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../Application/Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../../Application/Contracts/Repositories/IUserRepository.js';
import { IEventRepository } from '../../Application/Contracts/Providers/IEventRepository.js';
import { IPump } from '../../Application/Contracts/Services/IPump.js';
import { Chat } from '../../Domain/Aggregates/Chat.js';
import { GroupEpochKey } from '../../Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../Domain/Encryption/GroupWriteKey.js';
import { ChatMember } from '../../Domain/Entities/ChatMember.js';
import { GroupRecord } from '../../Domain/Entities/GroupRecord.js';
import { GroupLifecycle } from '../../Domain/Enums/GroupLifecycle.js';
import { LedgerOperationType } from '../../Domain/Enums/LedgerOperationType.js';
import { ControlMessageQueuedEvent } from '../../Domain/Events/ControlMessageQueuedEvent.js';
import { LedgerOperationQueuedEvent } from '../../Domain/Events/LedgerOperationQueuedEvent.js';
import { GroupState } from '../../Domain/Projections/GroupState.js';
import { generateWriteKeyPair } from '../Crypto/LedgerCodec.js';

export class GroupInviteService implements IGroupInviteService {
    constructor(
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly ledgerSyncService: ILedgerSyncService,
        private readonly chatStore: IChatStore,
        private readonly userRepository: IUserRepository,
        private readonly eventRepository: IEventRepository,
        private readonly ledgerPump: IPump,
        private readonly mainWindow: BrowserWindow,
    ) { }

    public async acceptInvite(payload: GroupInvitePayload, senderConnectionId: string): Promise<void> {
        for (const [epoch, key] of Object.entries(payload.epochKeys)) {
            await this.groupKeyRepository.saveEpochKey(
                new GroupEpochKey(payload.groupId, Number(epoch), Buffer.from(key, 'base64')),
            );
        }

        const synced = await this.ledgerSyncService.sync(payload.groupId);
        if (!synced.success) return;

        const user = await this.userRepository.get(true);

        // An invite is only a key delivery. The ledger decides whether we are actually a member.
        if (!synced.data!.state.members.has(user.userTag)) return;

        await this.project(payload.groupId, synced.data!.state, GroupLifecycle.Active);

        const existing = await this.groupKeyRepository.getWriteKey(payload.groupId);
        if (existing) return;

        const writeKey = generateWriteKeyPair();
        await this.groupKeyRepository.saveWriteKey(
            new GroupWriteKey(payload.groupId, writeKey.publicKey, writeKey.privateKey),
        );

        await this.eventRepository.appendEvent(
            new ControlMessageQueuedEvent(
                uuid().toString(),
                PayloadType.GroupWriteKeyOffer,
                new GroupWriteKeyOfferPayload(
                    payload.groupId,
                    writeKey.publicKey.toString('base64'),
                    user.userTag,
                    user.displayName ?? user.username,
                    (await this.identityKeyOf(synced.data!.state, user.userTag)) ?? '',
                    [],
                ),
                [senderConnectionId],
                new Date(),
            ),
        );

    }

    public async registerWriteKey(payload: GroupWriteKeyOfferPayload, _senderConnectionId: string): Promise<void> {
        const synced = await this.ledgerSyncService.sync(payload.groupId);
        if (!synced.success) return;

        const user = await this.userRepository.get(true);
        const member = synced.data!.state.members.get(payload.userTag);

        const operation = member
            ? {
                  type: LedgerOperationType.WriteKeyRegistered as const,
                  authorTag: user.userTag,
                  at: Date.now(),
                  userTag: payload.userTag,
                  writeKeyPublic: payload.writeKeyPublic,
              }
            : {
                  type: LedgerOperationType.MemberAdded as const,
                  authorTag: user.userTag,
                  at: Date.now(),
                  member: {
                      userTag: payload.userTag,
                      displayName: payload.displayName,
                      privilege: 1,
                      identityKey: payload.identityKey,
                  },
                  writeKeyPublic: payload.writeKeyPublic,
              };

        if (member?.writeKeys.includes(payload.writeKeyPublic)) return;

        await this.eventRepository.appendEvent(
            new LedgerOperationQueuedEvent(uuid().toString(), payload.groupId, operation, false, new Date()),
        );

        this.ledgerPump.notify();
    }

    public async catchUp(payload: LedgerAdvancedPayload): Promise<void> {
        const synced = await this.ledgerSyncService.sync(payload.groupId);
        if (!synced.success) return;

        const state = synced.data!.state;

        // The claim rode the ratchet, which the server cannot forge: a mismatch means it served two logs.
        if (state.version === payload.version && state.headHash.toString('base64') !== payload.headHash) {
            console.error(`GroupInviteService: ledger fork detected for ${payload.groupId} at version ${payload.version}`);
            this.mainWindow.webContents.send('eventMessage', {
                kind: 'ledgerFork',
                chatId: payload.groupId,
                version: payload.version,
            });
            return;
        }

        await this.project(payload.groupId, state, GroupLifecycle.Active);
    }

    private async identityKeyOf(state: GroupState, userTag: string): Promise<string | null> {
        return state.members.get(userTag)?.identityKey ?? null;
    }

    private async project(groupId: string, state: GroupState, lifecycle: GroupLifecycle): Promise<void> {
        const user = await this.userRepository.get(true);
        const members = [...state.members.values()]
            .filter((member) => member.userTag !== user.userTag)
            .map((member) =>
                ChatMember.createExternal(
                    uuid().toString(),
                    member.privilege,
                    member.userTag,
                    member.displayName,
                    member.connectionIds,
                ),
            );

        const existing = await this.chatStore.getChat(groupId);

        if (!existing) {
            const chat = new Chat(groupId, members, [], state.messageTtl ?? 0, false, groupId);
            chat.groupName = state.name;
            await this.chatStore.create(chat);
        }

        const group = (await this.groupRepository.get(groupId)) ?? new GroupRecord(groupId);
        group.lifecycle = lifecycle;
        await this.groupRepository.save(group);

        this.mainWindow.webContents.send('eventMessage', { kind: 'groupUpdated', chatId: groupId });
    }
}
