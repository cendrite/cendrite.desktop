import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';

export function getChatByMemberId(chats: ChatViewModel[], memberId: string): ChatViewModel | null {
    const singleMemberChats = chats.filter((chat) => chat.isGroup === false);
    const chat = singleMemberChats.find((chat) => chat.chatMembers[0].userTag === memberId);
    return chat !== undefined ? chat : null;
}

export function getChatById(chats: ChatViewModel[], chatId: string): ChatViewModel {
    const chat = chats.find((chat) => chat.id === chatId);
    if (!chat) {
        throw new Error(`Chat with id ${chatId} not found`);
    }
    return chat;
}

export function getChat(context: ChatViewModel[], id: string): ChatViewModel | null {
    return context.find((chat) => chat.id === id) || null;
}
