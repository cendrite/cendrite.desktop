import { IGroupMembershipGuard } from '../../Application/Contracts/Services/IGroupMembershipGuard.js';
import { ILedgerReplayService } from '../../Application/Contracts/Services/ILedgerReplayService.js';
import { ILedgerLogRepository } from '../../Application/Contracts/Repositories/ILedgerLogRepository.js';

export class GroupMembershipGuard implements IGroupMembershipGuard {
    constructor(
        private readonly ledgerLogRepository: ILedgerLogRepository,
        private readonly ledgerReplayService: ILedgerReplayService,
    ) { }

    public async isMember(groupId: string, connectionId: string): Promise<boolean> {
        const events = await this.ledgerLogRepository.getAll(groupId);
        if (events.length === 0) return false;

        const { state } = await this.ledgerReplayService.replay(groupId, events);

        for (const member of state.members.values()) {
            if (member.connectionIds.includes(connectionId)) return true;
        }

        return false;
    }
}
