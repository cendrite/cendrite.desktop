import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { ILedgerSyncService } from '#electron/Application/Contracts/Services/ILedgerSyncService';
import { ILedgerWriter } from '#electron/Application/Contracts/Services/ILedgerWriter';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { PendingGroupWriteKey } from '#electron/Domain/Encryption/PendingGroupWriteKey';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { WriteKeyRegisteredOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { generateWriteKeyPair } from '../Crypto/LedgerCodec.js';
import { Pump } from './Pump.js';

export class WriteKeySwapPump extends Pump {
    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly userRepository: IUserRepository,
        private readonly ledgerSyncService: ILedgerSyncService,
        private readonly ledgerWriter: ILedgerWriter,
        private readonly mainWindow: Electron.BrowserWindow,
    ) {
        super();
    }

    protected async process(): Promise<void> {
        while (this.isRunning) {
            for (const groupId of await this.groupRepository.getIds()) {
                try {
                    await this.reconcile(groupId);
                } catch (error) {
                    console.error(`WriteKeySwapPump: could not reconcile group ${groupId}`, error);
                }
            }

            await this.sleep(60_000);
        }
    }

    public async reconcile(groupId: string): Promise<void> {
        const group = await this.groupRepository.get(groupId);
        if (group?.lifecycle !== GroupLifecycle.Active) return;

        const current = await this.groupKeyRepository.getWriteKey(groupId);
        if (!current) return;

        const pending = await this.groupKeyRepository.getPendingWriteKey(groupId);
        const userTag = (await this.userRepository.get(true)).userTag;

        let synced = await this.ledgerSyncService.sync(groupId);

        if (!synced.success) {
            if (!pending) {
                if (synced.errorMessage.code === 'Not Found') {
                    await this.flagTampered(groupId, 'this device can no longer read the group');
                }
                return;
            }

            await this.groupKeyRepository.saveWriteKey(new GroupWriteKey(groupId, pending.publicKey, pending.privateKey));
            synced = await this.ledgerSyncService.sync(groupId);

            if (!synced.success) {
                await this.groupKeyRepository.saveWriteKey(current);
                return;
            }
        }

        if (synced.data.halted || synced.data.stalledAt !== null) return;

        const member = synced.data.state.members.get(userTag);
        if (!member) return;

        const active = (await this.groupKeyRepository.getWriteKey(groupId))!;
        const activePublic = active.publicKey.toString('base64');

        if (member.writeKeys.includes(activePublic)) {
            if (pending) await this.groupKeyRepository.deletePendingWriteKey(groupId);
            return;
        }

        if (!member.inviteKeys.includes(activePublic)) {
            await this.flagTampered(groupId, "this device's key is no longer in the group");
            return;
        }

        await this.swap(groupId, userTag, active, pending);
    }

    private async swap(groupId: string, userTag: string, invite: GroupWriteKey, pending: PendingGroupWriteKey | null): Promise<void> {
        const next = pending ?? this.newPendingKey(groupId);
        if (!pending) await this.groupKeyRepository.savePendingWriteKey(next);

        const appended = await this.ledgerWriter.append(
            groupId,
            new WriteKeyRegisteredOperation(userTag, invite.publicKey.toString('base64'), next.publicKey.toString('base64')),
        );

        if (!appended.success) {
            if (appended.errorMessage?.code === 'Forbidden') {
                await this.flagTampered(groupId, 'the invite key was already used');
            }
            return;
        }

        await this.groupKeyRepository.saveWriteKey(new GroupWriteKey(groupId, next.publicKey, next.privateKey));
        await this.groupKeyRepository.deletePendingWriteKey(groupId);
    }

    private async flagTampered(groupId: string, reason: string): Promise<void> {
        console.error(`WriteKeySwapPump: ${reason} (group ${groupId}), membership may have been tampered with`);

        const group = await this.groupRepository.get(groupId);
        if (!group || group.membershipTampered) return;

        group.membershipTampered = true;
        await this.groupRepository.update(group);

        this.mainWindow.webContents.send('eventMessage', { kind: 'membershipTampered', groupId });
    }

    private newPendingKey(groupId: string): PendingGroupWriteKey {
        const key = generateWriteKeyPair();
        return new PendingGroupWriteKey(groupId, key.publicKey, key.privateKey);
    }
}
