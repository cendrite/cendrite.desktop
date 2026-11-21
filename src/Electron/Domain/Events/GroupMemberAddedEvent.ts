import { MemberAddedOperation } from '../Protocol/LedgerOperation.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

export class GroupMemberAddedEvent extends DomainEvent {
    static readonly type = GroupMemberAddedEvent.name;

    constructor(
        id: string,
        public readonly groupId: string,
        public readonly operation: MemberAddedOperation,
        public readonly inviteKeys: Record<string, string>,
        occurredOn: Date,
    ) {
        super(id, occurredOn);
    }
}

registerDomainEvent(GroupMemberAddedEvent.type, GroupMemberAddedEvent, (raw: any, occurredOn: Date) => {
    return new GroupMemberAddedEvent(raw.id, raw.groupId, raw.operation, raw.inviteKeys, occurredOn);
});
