import { LedgerOperation } from '../Protocol/LedgerOperation.js';
import { DomainEvent, registerDomainEvent } from './IDomainEvent.js';

export class GroupChangeEvent extends DomainEvent {
    static readonly type = GroupChangeEvent.name;

    constructor(
        id: string,
        public readonly groupId: string,
        public readonly operation: LedgerOperation,
        public readonly inviteKeys: Record<string, string>,
        occurredOn: Date,
        public readonly alsoNotify: string[] = [],
    ) {
        super(id, occurredOn);
    }
}

registerDomainEvent(GroupChangeEvent.type, GroupChangeEvent, (raw: any, occurredOn: Date) => {
    return new GroupChangeEvent(raw.id, raw.groupId, raw.operation, raw.inviteKeys, occurredOn, raw.alsoNotify ?? []);
});
