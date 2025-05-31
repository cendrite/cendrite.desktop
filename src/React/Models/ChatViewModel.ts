import {MessageViewModel} from "./MessageViewModel.ts";
import {ChatMemberViewModel} from "./ChatMemberViewModel.ts";
import {DeliveryStatus} from "../../Electron/Domain/Enums/DeliveryStatus.ts";

export class ChatViewModel {
    id: string;
    chatMembers: ChatMemberViewModel[];
    messages: MessageViewModel[];
    muted: boolean = false;
    mutedTimer: Date | null = null;

    constructor(id: string, contact: ChatMemberViewModel[], messages: MessageViewModel[] = []) {
        this.id = id;
        this.chatMembers = contact;
        this.messages = messages;
    }

    get lastMessage(): MessageViewModel | null {
        return this.messages[0] ?? null;
    }

    get lastMessageDate(): Date {
        return this.messages.length > 0
            ? this.messages[this.messages.length - 1].date
            : new Date();
    }

    getUnreadMessagesCount(currentUserId: string): number {
        return this.messages.reduce(
            (count, message) =>
                message.senderId !== currentUserId && message.deliveryStatus !== DeliveryStatus.Received
                    ? count + 1
                    : count,
            0
        );
    }
}
