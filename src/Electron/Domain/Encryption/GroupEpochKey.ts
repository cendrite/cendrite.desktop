export class GroupEpochKey {
    groupId: string;
    epoch: number;
    key: Buffer;

    constructor(groupId: string, epoch: number, key: Buffer) {
        this.groupId = groupId;
        this.epoch = epoch;
        this.key = key;
    }
}
