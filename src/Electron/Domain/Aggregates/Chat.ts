import {Message} from "../Entities/Message.js";
import {ChatMember} from "../Entities/ChatMember.js";

export class Chat {
    id!: string;
    groupId: string | null;
    isGroup!: boolean;
    groupName: string | null;
    members!: ChatMember[];
    messages!: Message[];
    messageTtl!: number | null;
    muted!: boolean;
    muteTimer!: number | null;

    constructor(id: string, members: ChatMember[], groupId: string |null = null) {
        this.id = id;
        this.groupId = groupId;
        this.members = members;
        this.isGroup = groupId !== null;
        this.muteTimer = null;
        this.groupName = null;
    }
}