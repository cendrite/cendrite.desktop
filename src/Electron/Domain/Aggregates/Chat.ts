import { Message } from '../Entities/Message.js';
import { ChatMember } from '../Entities/ChatMember.js';

export class Chat {
    id: string;
    groupName: string | null;
    members: ChatMember[];
    messages: Message[];
    messageTtl: number | null;
    muted: boolean;
    muteTimer: number | null;

    constructor(
        id: string,
        members: ChatMember[],
        messages: Message[],
        groupName: string | null = null,
        messageTtl: number = 0,
        muted: boolean = false,
    ) {
        this.id = id;
        this.members = members;
        this.muteTimer = null;
        this.groupName = groupName;
        this.messageTtl = messageTtl;
        this.muted = muted;
        this.messages = messages;
    }
}
