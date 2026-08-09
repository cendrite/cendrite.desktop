import { ChatMemberContract } from "./ChatMemberContract.js";
import { MessageContract } from "./MessageContract.js";

export class ChatContract {
    id: string;
    groupId: string | null;
    isGroup: boolean;
    groupName: string | null;
    members: ChatMemberContract[];
    messages: MessageContract[];
    messageTtl: number | null;
    muted: boolean;
    muteTimer: number | null;

    constructor(
        id: string,
        groupId: string | null,
        isGroup: boolean,
        groupName: string | null,
        members: ChatMemberContract[],
        messageTtl: number | null,
        muted: boolean,
        muteTimer: number | null,
        messages: MessageContract[]
    ) {
        this.id = id;
        this.groupId = groupId;
        this.isGroup = isGroup;
        this.groupName = groupName;
        this.members = members;
        this.messages = messages;
        this.messageTtl = messageTtl;
        this.muted = muted;
        this.muteTimer = muteTimer;
    }
}

