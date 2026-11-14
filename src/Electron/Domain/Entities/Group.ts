import { GroupLifecycle } from "../Enums/GroupLifecycle.js";
import { PendingGroupStart } from "./PendingGroupStart.js";

export class Group {
    groupId: string;
    lifecycle: GroupLifecycle;
    version: number;
    headHash: Buffer;
    epoch: number;
    archived: boolean;
    publishedDevicesHash: string | null;
    pendingStart: PendingGroupStart | null;

    constructor(
        groupId: string,
        lifecycle: GroupLifecycle = GroupLifecycle.Draft,
        version: number = 0,
        headHash: Buffer = Buffer.alloc(32),
        epoch: number = 1,
        archived: boolean = false,
        publishedDevicesHash: string | null = null,
        pendingStart: PendingGroupStart | null = null,
    ) {
        this.groupId = groupId;
        this.lifecycle = lifecycle;
        this.version = version;
        this.headHash = headHash;
        this.epoch = epoch;
        this.archived = archived;
        this.publishedDevicesHash = publishedDevicesHash;
        this.pendingStart = pendingStart;
    }
}
