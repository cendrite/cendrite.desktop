import { IChatStore } from '../../Application/Contracts/Repositories/IChatStore.js';
import { IGroupMembershipGuard } from '../../Application/Contracts/Services/IGroupMembershipGuard.js';

/**
 * Membership is enforced against the local projection of the group, which exists from the moment the
 * GroupCreated envelope arrives and is kept current by the ledger.
 */
export class GroupMembershipGuard implements IGroupMembershipGuard {
    constructor(private readonly chatStore: IChatStore) { }

    public async isMember(groupId: string, connectionId: string): Promise<boolean> {
        const chat = await this.chatStore.getChatWithMembers(groupId);
        if (!chat) return false;

        return chat.members.some((member) => member.devices.includes(connectionId));
    }
}
