import {ChatViewModel} from "../../Models/ChatViewModel.ts";

export function getChatByMemberId(chats: ChatViewModel[], memberId: string): ChatViewModel | null {
    const singleMemberChats = chats.filter(chat => chat.chatMembers.length === 1);
    const chat = singleMemberChats.find(chat => chat.chatMembers[0].contact.id === memberId);
    return chat !== undefined ? chat : null;
}