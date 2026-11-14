import { createHash } from 'crypto';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { uuidToBytes } from './LedgerCodec.js';

const DOMAIN_PREFIX = Buffer.from('group-state-v1', 'ascii');
const ABSENT = Buffer.from([0]);
const PRESENT = Buffer.from([1]);

export function groupStateHash(state: GroupState): Buffer {
    const members = [...state.members.values()].sort((a, b) => compare(a.userTag, b.userTag));

    const input = Buffer.concat([
        DOMAIN_PREFIX,
        uuidToBytes(state.groupId),
        uint32(state.version),
        Buffer.from(state.headHash),
        uint32(state.epoch),
        state.name === null ? ABSENT : Buffer.concat([PRESENT, text(state.name)]),
        state.messageTtl === null ? ABSENT : Buffer.concat([PRESENT, uint32(state.messageTtl)]),
        uint32(members.length),
        ...members.map((member) =>
            Buffer.concat([
                text(member.userTag),
                Buffer.from([member.privilege]),
                textList(member.writeKeys),
                textList(member.inviteKeys),
                textList(member.connectionIds),
            ]),
        ),
    ]);

    return createHash('sha256').update(input).digest();
}

function compare(a: string, b: string): number {
    return Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

function uint32(value: number): Buffer {
    const bytes = Buffer.alloc(4);
    bytes.writeUInt32BE(value);
    return bytes;
}

function text(value: string): Buffer {
    const bytes = Buffer.from(value, 'utf8');
    return Buffer.concat([uint32(bytes.length), bytes]);
}

function textList(values: string[]): Buffer {
    const sorted = [...values].sort(compare);
    return Buffer.concat([uint32(sorted.length), ...sorted.map(text)]);
}
