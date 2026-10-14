import { describe, expect, test } from 'vitest';
import { ChatAction, ChatActionType, chatReducer } from '../../../../../src/React/Context/Chat/ChatReducer.ts';
import { ChatState } from '../../../../../src/React/Context/Chat/ChatContext.tsx';
import { ChatViewModel } from '../../../../../src/React/Models/ChatViewModel.ts';
import { MessageViewModel } from '../../../../../src/React/Models/MessageViewModel.ts';
import { DeliveryStatus } from '../../../../../src/Shared/Enums/DeliveryStatus.ts';

function message(id: string, chatId = 'c1', status = DeliveryStatus.Received, senderId = 'them'): MessageViewModel {
    return new MessageViewModel(id, chatId, senderId, 'text-' + id, new Date(0), [], status);
}

function chat(id: string, messages: MessageViewModel[] = []): ChatViewModel {
    return new ChatViewModel(id, [], messages, true, 'group', true, new Date(5));
}

function stateOf(chats: ChatViewModel[], activeChatId: string | null = null): ChatState {
    return { chats, activeChatId };
}

describe('chats', () => {
    test('init replaces the chats and keeps the active chat', () => {
        const state = chatReducer(stateOf([chat('old')], 'old'), {
            type: ChatActionType.Init,
            payload: [chat('new')],
        });

        expect(state.chats.map((c) => c.id)).toEqual(['new']);
        expect(state.activeChatId).toBe('old');
    });

    test('add chat appends', () => {
        const state = chatReducer(stateOf([chat('a')]), { type: ChatActionType.AddChat, payload: chat('b') });

        expect(state.chats.map((c) => c.id)).toEqual(['a', 'b']);
    });

    test('adding a chat that is already there returns the same state object', () => {
        const before = stateOf([chat('a')]);

        expect(chatReducer(before, { type: ChatActionType.AddChat, payload: chat('a') })).toBe(before);
    });

    test('removing the active chat clears the active chat', () => {
        const state = chatReducer(stateOf([chat('a'), chat('b')], 'a'), {
            type: ChatActionType.RemoveChat,
            payload: chat('a'),
        });

        expect(state.chats.map((c) => c.id)).toEqual(['b']);
        expect(state.activeChatId).toBeNull();
    });

    test('removing another chat keeps the active chat', () => {
        const state = chatReducer(stateOf([chat('a'), chat('b')], 'a'), {
            type: ChatActionType.RemoveChat,
            payload: chat('b'),
        });

        expect(state.activeChatId).toBe('a');
    });

    test('set and clear active chat', () => {
        const set = chatReducer(stateOf([]), { type: ChatActionType.SetActiveChat, payload: { chatId: 'a' } });
        const cleared = chatReducer(set, { type: ChatActionType.ClearActiveChat });

        expect(set.activeChatId).toBe('a');
        expect(cleared.activeChatId).toBeNull();
    });

    test('clear empties chats and the active chat', () => {
        const state = chatReducer(stateOf([chat('a')], 'a'), { type: ChatActionType.Clear });

        expect(state).toEqual({ chats: [], activeChatId: null });
    });
});

describe('unknown actions', () => {
    test('throw', () => {
        const unknown = { type: 99 } as unknown as ChatAction;

        expect(() => chatReducer(stateOf([]), unknown)).toThrow('Unknown action type in ChatReducer');
    });
});

describe('adding messages', () => {
    test('appends to the matching chat only', () => {
        const state = chatReducer(stateOf([chat('c1'), chat('c2')]), {
            type: ChatActionType.AddMessage,
            payload: message('m1', 'c1'),
        });

        expect(state.chats[0].messages.map((m) => m.id)).toEqual(['m1']);
        expect(state.chats[1].messages).toEqual([]);
    });

    test('keeps the rest of the chat intact', () => {
        const state = chatReducer(stateOf([chat('c1')]), {
            type: ChatActionType.AddMessage,
            payload: message('m1', 'c1'),
        });

        const updated = state.chats[0];
        expect([updated.isGroup, updated.groupName, updated.muted, updated.mutedTimer]).toEqual([
            true,
            'group',
            true,
            new Date(5),
        ]);
    });

    test('a message that is already there is ignored and the chat object is kept', () => {
        const existing = chat('c1', [message('m1', 'c1')]);

        const state = chatReducer(stateOf([existing]), {
            type: ChatActionType.AddMessage,
            payload: message('m1', 'c1'),
        });

        expect(state.chats[0]).toBe(existing);
    });

    test('a message for an unknown chat changes nothing', () => {
        const existing = chat('c1');

        const state = chatReducer(stateOf([existing]), {
            type: ChatActionType.AddMessage,
            payload: message('m1', 'other'),
        });

        expect(state.chats[0]).toBe(existing);
    });
});

describe('prepending messages', () => {
    test('older messages go before the existing ones', () => {
        const state = chatReducer(stateOf([chat('c1', [message('m3', 'c1')])]), {
            type: ChatActionType.PrependMessages,
            payload: { chatId: 'c1', messages: [message('m1', 'c1'), message('m2', 'c1')] },
        });

        expect(state.chats[0].messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    });

    test('messages that are already present are not duplicated', () => {
        const state = chatReducer(stateOf([chat('c1', [message('m2', 'c1')])]), {
            type: ChatActionType.PrependMessages,
            payload: { chatId: 'c1', messages: [message('m1', 'c1'), message('m2', 'c1')] },
        });

        expect(state.chats[0].messages.map((m) => m.id)).toEqual(['m1', 'm2']);
    });

    test('prepending nothing new keeps the chat object', () => {
        const existing = chat('c1', [message('m1', 'c1')]);

        const state = chatReducer(stateOf([existing]), {
            type: ChatActionType.PrependMessages,
            payload: { chatId: 'c1', messages: [message('m1', 'c1')] },
        });

        expect(state.chats[0]).toBe(existing);
    });
});

describe('marking as read', () => {
    test('only the listed messages of that chat become read', () => {
        const state = chatReducer(
            stateOf([chat('c1', [message('m1', 'c1'), message('m2', 'c1')]), chat('c2', [message('m1', 'c2')])]),
            { type: ChatActionType.MarkAsRead, payload: { chatId: 'c1', messagesIds: ['m1'] } },
        );

        expect(state.chats[0].messages.map((m) => m.deliveryStatus)).toEqual([
            DeliveryStatus.Read,
            DeliveryStatus.Received,
        ]);
        expect(state.chats[1].messages[0].deliveryStatus).toBe(DeliveryStatus.Received);
    });

    test('keeps every other field of the message', () => {
        const original = message('m1', 'c1');

        const state = chatReducer(stateOf([chat('c1', [original])]), {
            type: ChatActionType.MarkAsRead,
            payload: { chatId: 'c1', messagesIds: ['m1'] },
        });

        expect(state.chats[0].messages[0]).toEqual({ ...original, deliveryStatus: DeliveryStatus.Read });
    });

    test('does not mutate the original message', () => {
        const original = message('m1', 'c1');

        chatReducer(stateOf([chat('c1', [original])]), {
            type: ChatActionType.MarkAsRead,
            payload: { chatId: 'c1', messagesIds: ['m1'] },
        });

        expect(original.deliveryStatus).toBe(DeliveryStatus.Received);
    });

    test('lowers the unread count for the current user', () => {
        const before = chat('c1', [message('m1', 'c1'), message('m2', 'c1')]);
        expect(before.getUnreadMessagesCount('me')).toBe(2);

        const state = chatReducer(stateOf([before]), {
            type: ChatActionType.MarkAsRead,
            payload: { chatId: 'c1', messagesIds: ['m1'] },
        });

        expect(state.chats[0].getUnreadMessagesCount('me')).toBe(1);
    });
});

describe('delivery status updates', () => {
    test('sets the status on the listed messages of that chat only', () => {
        const state = chatReducer(
            stateOf([
                chat('c1', [message('m1', 'c1', DeliveryStatus.Sent), message('m2', 'c1', DeliveryStatus.Sent)]),
                chat('c2', [message('m1', 'c2', DeliveryStatus.Sent)]),
            ]),
            {
                type: ChatActionType.UpdateMessageDeliveryStatus,
                payload: { chatId: 'c1', messageIds: ['m1'], status: DeliveryStatus.Delivered },
            },
        );

        expect(state.chats[0].messages.map((m) => m.deliveryStatus)).toEqual([
            DeliveryStatus.Delivered,
            DeliveryStatus.Sent,
        ]);
        expect(state.chats[1].messages[0].deliveryStatus).toBe(DeliveryStatus.Sent);
    });

    test('an unknown chat changes nothing', () => {
        const existing = chat('c1', [message('m1', 'c1', DeliveryStatus.Sent)]);

        const state = chatReducer(stateOf([existing]), {
            type: ChatActionType.UpdateMessageDeliveryStatus,
            payload: { chatId: 'other', messageIds: ['m1'], status: DeliveryStatus.Delivered },
        });

        expect(state.chats[0]).toBe(existing);
    });
});
