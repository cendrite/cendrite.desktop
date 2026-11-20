import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { ILedgerSyncService } from '#electron/Application/Contracts/Services/ILedgerSyncService';
import { ILedgerWriter } from '#electron/Application/Contracts/Services/ILedgerWriter';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { PendingGroupWriteKey } from '#electron/Domain/Encryption/PendingGroupWriteKey';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { MembershipWarning } from '#shared/Enums/MembershipWarning';
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

        if (!synced.success && pending) {
            await this.groupKeyRepository.saveWriteKey(new GroupWriteKey(groupId, pending.publicKey, pending.privateKey));
            synced = await this.ledgerSyncService.sync(groupId);

            if (!synced.success) await this.groupKeyRepository.saveWriteKey(current);
        }

        if (!synced.success) {
            if (isRefused(synced.errorMessage?.code)) await this.warn(group, MembershipWarning.LostAccess);
            return;
        }

        if (synced.data.halted) {
            await this.warn(group, MembershipWarning.Tampered);
            return;
        }

        if (synced.data.stalledAt !== null) return;

        const member = synced.data.state.members.get(userTag);
        if (!member) return;

        const active = (await this.groupKeyRepository.getWriteKey(groupId))!;
        const activePublic = active.publicKey.toString('base64');

        if (member.writeKeys.includes(activePublic)) {
            await this.warn(group, null);
            if (pending) {
                await this.groupKeyRepository.deletePendingWriteKey(groupId);
                this.sendEvent({ kind: 'groupEditable', groupId });
            }
            return;
        }

        if (!member.inviteKeys.includes(activePublic)) {
            await this.warn(group, MembershipWarning.Tampered);
            return;
        }

        await this.warn(group, null);
        await this.swap(group, userTag, active, pending);
    }

    private async swap(group: Group, userTag: string, invite: GroupWriteKey, pending: PendingGroupWriteKey | null): Promise<void> {
        const groupId = group.groupId;
        const next = pending ?? this.newPendingKey(groupId);
        if (!pending) await this.groupKeyRepository.savePendingWriteKey(next);

        const appended = await this.ledgerWriter.append(
            groupId,
            new WriteKeyRegisteredOperation(userTag, invite.publicKey.toString('base64'), next.publicKey.toString('base64')),
        );

        if (!appended.success) {
            if (appended.errorMessage?.code === 'Forbidden') await this.warn(group, MembershipWarning.Tampered);
            return;
        }

        await this.groupKeyRepository.saveWriteKey(new GroupWriteKey(groupId, next.publicKey, next.privateKey));
        await this.groupKeyRepository.deletePendingWriteKey(groupId);
        this.sendEvent({ kind: 'groupEditable', groupId });
    }

    private async warn(group: Group, warning: MembershipWarning | null): Promise<void> {
        if (group.membershipWarning === warning) return;

        if (warning !== null) console.error(`WriteKeySwapPump: membership of group ${group.groupId} may have been tampered with (${MembershipWarning[warning]})`);

        group.membershipWarning = warning;
        await this.groupRepository.setMembershipWarning(group.groupId, warning);
        this.sendEvent({ kind: 'membershipWarning', groupId: group.groupId, warning });
    }

    private sendEvent(event: EventMessage): void {
        if (!this.mainWindow.isDestroyed()) this.mainWindow.webContents.send('eventMessage', event);
    }

    private newPendingKey(groupId: string): PendingGroupWriteKey {
        const key = generateWriteKeyPair();
        return new PendingGroupWriteKey(groupId, key.publicKey, key.privateKey);
    }
}

function isRefused(code: string | null | undefined): boolean {
    return code === 'Forbidden' || code === 'Not Found';
}
