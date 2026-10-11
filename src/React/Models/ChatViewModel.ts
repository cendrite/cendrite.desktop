import { MessageViewModel } from './MessageViewModel.ts';
import { ChatMemberViewModel } from './ChatMemberViewModel.ts';
import { DeliveryStatus } from '../../Electron/Domain/Enums/DeliveryStatus.ts';

export class ChatViewModel {
    id: string;
    chatMembers: ChatMemberViewModel[];
    messages: MessageViewModel[];
    isGroup: boolean;
    groupName: string | null;
    muted: boolean = false;
    mutedTimer: Date | null = null;

    constructor(
        id: string,
        contact: ChatMemberViewModel[],
        messages: MessageViewModel[] = [],
        isGroup: boolean = false,
        groupName: string | null = null,
        muted: boolean = false,
        mutedTimer: Date | null = null,
    ) {
        this.id = id;
        this.chatMembers = contact;
        this.messages = messages;
        this.isGroup = isGroup;
        this.groupName = groupName;
        this.muted = muted;
        this.mutedTimer = mutedTimer;
    }

    get connectionIds(): string[] {
        return this.chatMembers.map((member) => member.devices).flat();
    }

    get displayName(): string {
        if (this.isGroup == false) throw new Error('displayName is only available for group chats');

        return (
            this.groupName ??
            this.chatMembers.map((member) => member.displayName ?? member.contact?.username).join(', ')
        );
    }

    get lastMessage(): MessageViewModel | null {
        return this.messages[0] ?? null;
    }

    get lastMessageDate(): Date {
        return this.messages.length > 0 ? this.messages[this.messages.length - 1].date : new Date();
    }

    getUnreadMessagesCount(currentUserId: string): number {
        return this.messages.reduce(
            (count, message) =>
                message.senderId !== currentUserId && message.deliveryStatus === DeliveryStatus.Received
                    ? count + 1
                    : count,
            0,
        );
    }

    getUnreadMessages(userId: string): MessageViewModel[] {
        return this.messages.filter(
            (message) => message.senderId !== userId && message.deliveryStatus === DeliveryStatus.Received,
        );
    }
}
