import { ChatMemberDto } from "./ChatMemberDto.js";
import { MessageDto } from "./MessageDto.js";

export class ChatDto {
    id: string;
    groupId: string | null;
    isGroup: boolean;
    groupName: string | null;
    members: ChatMemberDto[];
    messages: MessageDto[]
    messageTtl: number | null;
    muted: boolean;
    muteTimer: number | null;

    constructor(
        id: string,
        groupId: string | null,
        isGroup: boolean,
        groupName: string | null,
        members: ChatMemberDto[],
        messageTtl: number | null,
        muted: boolean,
        muteTimer: number | null,
        messages: MessageDto[]
    ) {
        this.id = id;
        this.groupId = groupId;
        this.isGroup = isGroup;
        this.groupName = groupName;
        this.members = members;
        this.messageTtl = messageTtl;
        this.muted = muted;
        this.muteTimer = muteTimer;
        this.messages = messages;
    }
}
