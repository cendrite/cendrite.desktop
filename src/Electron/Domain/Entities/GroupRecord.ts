import { GroupLifecycle } from "../Enums/GroupLifecycle.js";

export class GroupRecord {
    groupId: string;
    lifecycle: GroupLifecycle;
    version: number;
    headHash: Buffer;
    epoch: number;
    archived: boolean;
    publishedDevicesHash: string | null;

    constructor(
        groupId: string,
        lifecycle: GroupLifecycle = GroupLifecycle.Draft,
        version: number = 0,
        headHash: Buffer = Buffer.alloc(32),
        epoch: number = 1,
        archived: boolean = false,
        publishedDevicesHash: string | null = null,
    ) {
        this.groupId = groupId;
        this.lifecycle = lifecycle;
        this.version = version;
        this.headHash = headHash;
        this.epoch = epoch;
        this.archived = archived;
        this.publishedDevicesHash = publishedDevicesHash;
    }
}
