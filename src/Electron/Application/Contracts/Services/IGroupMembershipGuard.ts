export interface IGroupMembershipGuard {
    /** Whether the ledger currently lists the device's owner as a member of the group. */
    isMember(groupId: string, connectionId: string): Promise<boolean>;
}
