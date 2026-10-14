import { describe, expect, test } from 'vitest';
import {
    NotificationAction,
    NotificationActionType,
    reducer,
} from '../../../../../src/React/Context/Notification/NotificationReducer.ts';
import { NotificationState } from '../../../../../src/React/Context/Notification/NotificationState.ts';

function reduce(actions: NotificationAction[], state = new NotificationState()): NotificationState {
    return actions.reduce(reducer, state);
}

const addChat = (chatId: string): NotificationAction => ({
    type: NotificationActionType.AddChat,
    payload: { chatId },
});
const removeChat = (chatId: string): NotificationAction => ({
    type: NotificationActionType.RemoveChat,
    payload: { chatId },
});
const addRequest = (userTag: string): NotificationAction => ({
    type: NotificationActionType.AddFriendRequest,
    payload: { userTag },
});
const removeRequest = (userTag: string): NotificationAction => ({
    type: NotificationActionType.RemoveFriendRequest,
    payload: { userTag },
});

describe('adding notifications', () => {
    test('a chat notification is counted', () => {
        const state = reduce([addChat('c1')]);

        expect(state.chatNotifications).toEqual([{ chatId: 'c1' }]);
        expect(state.count).toEqual({ chats: 1, friendRequests: 0, sidebar: 1 });
    });

    test('a friend request notification is counted', () => {
        const state = reduce([addRequest('alice')]);

        expect(state.friendRequestNotifications).toEqual([{ userTag: 'alice' }]);
        expect(state.count).toEqual({ chats: 0, friendRequests: 1, sidebar: 1 });
    });

    test('the sidebar count adds chats and friend requests together', () => {
        const state = reduce([addChat('c1'), addChat('c2'), addRequest('alice')]);

        expect(state.count).toEqual({ chats: 2, friendRequests: 1, sidebar: 3 });
    });

    test('a second notification for the same chat is ignored and keeps the same state object', () => {
        const once = reduce([addChat('c1')]);
        const twice = reducer(once, addChat('c1'));

        expect(twice).toBe(once);
    });

    test('a second friend request from the same tag is ignored and keeps the same state object', () => {
        const once = reduce([addRequest('alice')]);
        const twice = reducer(once, addRequest('alice'));

        expect(twice).toBe(once);
    });
});

describe('removing notifications', () => {
    test('removing a chat updates the counts', () => {
        const state = reduce([addChat('c1'), addChat('c2'), removeChat('c1')]);

        expect(state.chatNotifications).toEqual([{ chatId: 'c2' }]);
        expect(state.count).toEqual({ chats: 1, friendRequests: 0, sidebar: 1 });
    });

    test('removing a chat that has no notification returns the same state object', () => {
        const before = reduce([addChat('c1')]);

        expect(reducer(before, removeChat('missing'))).toBe(before);
    });

    test('removing a friend request updates the counts', () => {
        const state = reduce([addRequest('alice'), addRequest('bob'), removeRequest('alice')]);

        expect(state.friendRequestNotifications).toEqual([{ userTag: 'bob' }]);
        expect(state.count).toEqual({ chats: 0, friendRequests: 1, sidebar: 1 });
    });

    test('removing a friend request that is not there returns the same state object', () => {
        const before = reduce([addRequest('alice')]);

        expect(reducer(before, removeRequest('missing'))).toBe(before);
    });

    test('removing one kind does not touch the other', () => {
        const state = reduce([addChat('c1'), addRequest('alice'), removeChat('c1')]);

        expect(state.friendRequestNotifications).toEqual([{ userTag: 'alice' }]);
        expect(state.count).toEqual({ chats: 0, friendRequests: 1, sidebar: 1 });
    });
});

describe('clearing', () => {
    test('clear empties both lists and zeroes every count', () => {
        const state = reduce([addChat('c1'), addRequest('alice'), { type: NotificationActionType.Clear }]);

        expect(state).toEqual({
            chatNotifications: [],
            friendRequestNotifications: [],
            count: { chats: 0, friendRequests: 0, sidebar: 0 },
        });
    });
});

describe('unknown actions', () => {
    test('throw rather than silently returning the old state', () => {
        const unknown = { type: 99 } as unknown as NotificationAction;

        expect(() => reducer(new NotificationState(), unknown)).toThrow('Unknown action type');
    });
});
