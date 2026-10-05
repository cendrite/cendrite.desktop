import { v4 as uuid } from 'uuid';
import { BrowserWindow } from 'electron';
import { GroupCreatedPayload, LedgerAdvancedPayload } from '../../Application/Contracts/Messaging/Envelope.js';
import { IGroupJoinService } from '../../Application/Contracts/Services/IGroupJoinService.js';
import { ILedgerSyncService } from '../../Application/Contracts/Services/ILedgerSyncService.js';
import { IChatStore } from '../../Application/Contracts/Repositories/IChatStore.js';
import { IGroupKeyRepository } from '../../Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../Application/Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../../Application/Contracts/Repositories/IUserRepository.js';
import { Chat } from '../../Domain/Aggregates/Chat.js';
import { GroupEpochKey } from '../../Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../Domain/Encryption/GroupWriteKey.js';
import { ChatMember } from '../../Domain/Entities/ChatMember.js';
import { GroupRecord } from '../../Domain/Entities/GroupRecord.js';
import { GroupLifecycle } from '../../Domain/Enums/GroupLifecycle.js';
import { GroupState } from '../../Domain/Projections/GroupState.js';
import { publicKeyFromPrivate } from '../Crypto/LedgerCodec.js';
import { short, tag } from '../../Utilities.js';

export class GroupJoinService implements IGroupJoinService {
    constructor(
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly ledgerSyncService: ILedgerSyncService,
        private readonly chatStore: IChatStore,
        private readonly userRepository: IUserRepository,
        private readonly mainWindow: BrowserWindow,
    ) { }

    public async join(payload: GroupCreatedPayload, senderConnectionId: string): Promise<void> {
        const user = await this.userRepository.get(true);

        const mine = payload.members.find((member) => member.userTag === user.userTag);
        if (!mine) {
            console.warn(`${tag()} group: ${senderConnectionId} sent ${payload.groupId} without listing us, ignored`);
            return;
        }

        const existing = await this.chatStore.getChat(payload.groupId);
        if (existing) {
            console.log(`${tag()} group: already hold ${payload.groupId}`);
            return;
        }

        const privateKey = Buffer.from(payload.writeKeyPrivate, 'base64');

        await this.groupKeyRepository.saveEpochKey(
            new GroupEpochKey(payload.groupId, payload.epoch, Buffer.from(payload.epochKey, 'base64')),
        );
        await this.groupKeyRepository.saveWriteKey(
            new GroupWriteKey(payload.groupId, publicKeyFromPrivate(privateKey), privateKey),
        );

        const members = payload.members
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

        const chat = new Chat(payload.groupId, members, [], 0, false, payload.groupId);
        chat.groupName = payload.name;
        await this.chatStore.create(chat);

        const group = new GroupRecord(payload.groupId, GroupLifecycle.Active);
        group.epoch = payload.epoch;
        await this.groupRepository.save(group);

        console.log(
            `${tag()} group: joined ${payload.groupId} as ${user.userTag} with ${members.length} other member(s), write key ${short(publicKeyFromPrivate(privateKey))}`,
        );

        this.mainWindow.webContents.send('eventMessage', { kind: 'groupUpdated', chatId: payload.groupId });
    }

    public async catchUp(payload: LedgerAdvancedPayload): Promise<void> {
        const synced = await this.ledgerSyncService.sync(payload.groupId);
        if (!synced.success) {
            console.warn(`${tag()} catchup: sync failed for ${payload.groupId}: ${synced.errorMessage?.message}`);
            return;
        }

        const state = synced.data!.state;

        console.log(
            `${tag()} catchup: ${payload.groupId} at version ${state.version} head ${short(state.headHash)} members [${[...state.members.keys()].join(', ')}]`,
        );

        // The claim rode the ratchet, which the server cannot forge: a mismatch means it served two logs.
        if (state.version === payload.version && state.headHash.toString('base64') !== payload.headHash) {
            console.error(`${tag()} catchup: ledger fork detected for ${payload.groupId} at version ${payload.version}`);
            this.mainWindow.webContents.send('eventMessage', {
                kind: 'ledgerFork',
                chatId: payload.groupId,
                version: payload.version,
            });
            return;
        }

        await this.applyState(payload.groupId, state);
    }

    private async applyState(groupId: string, state: GroupState): Promise<void> {
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

        await this.chatStore.syncGroupMembers(groupId, state.name, members);

        this.mainWindow.webContents.send('eventMessage', { kind: 'groupUpdated', chatId: groupId });
    }
}
