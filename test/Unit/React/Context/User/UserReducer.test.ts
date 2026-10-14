import { describe, expect, test } from 'vitest';
import { UserAction, UserActionType, userReducer } from '../../../../../src/React/Context/User/UserReducer.ts';
import { User } from '../../../../../src/React/Models/User.ts';

function user(): User {
    return new User('id', 'alice', 'alice#1', 'device', 'conn-main', ['conn-a'], 'avatar', 'Alice');
}

describe('userReducer', () => {
    test('initialize sets the user', () => {
        const u = user();

        expect(userReducer(null, { type: UserActionType.Initialize, payload: u })).toBe(u);
    });

    test('clear drops the user', () => {
        expect(userReducer(user(), { type: UserActionType.Clear })).toBeNull();
    });

    test('update username changes only the username and keeps the User methods', () => {
        const state = userReducer(user(), {
            type: UserActionType.UpdateUsername,
            payload: { username: 'alice2' },
        });

        expect(state).toEqual({ ...user(), username: 'alice2' });
        expect(state?.IsUserConnectionId('conn-main')).toBe(true);
    });

    test('update display name changes only the display name and accepts null', () => {
        const state = userReducer(user(), {
            type: UserActionType.UpdateDisplayName,
            payload: { displayName: null },
        });

        expect(state).toEqual({ ...user(), displayName: null });
    });

    test('update avatar changes only the avatar key and accepts null', () => {
        const state = userReducer(user(), {
            type: UserActionType.UpdateAvatar,
            payload: { AvatarKey: null },
        });

        expect(state).toEqual({ ...user(), avatarKey: null });
    });

    test('adding a connection id makes it recognised as the user\'s', () => {
        const state = userReducer(user(), {
            type: UserActionType.AddConnectionId,
            payload: { connectionId: 'conn-b' },
        });

        expect(state?.externalConnectionIds).toEqual(['conn-a', 'conn-b']);
        expect(state?.IsUserConnectionId('conn-b')).toBe(true);
    });

    test('adding a connection id the user already has returns the same user', () => {
        const before = user();

        const state = userReducer(before, {
            type: UserActionType.AddConnectionId,
            payload: { connectionId: 'conn-a' },
        });

        expect(state).toBe(before);
    });

    test('removing a connection id makes it no longer recognised', () => {
        const state = userReducer(user(), {
            type: UserActionType.RemoveConnectionId,
            payload: { connectionId: 'conn-a' },
        });

        expect(state?.externalConnectionIds).toEqual([]);
        expect(state?.IsUserConnectionId('conn-a')).toBe(false);
    });

    test('an unknown action throws', () => {
        const unknown = { type: 99 } as unknown as UserAction;

        expect(() => userReducer(user(), unknown)).toThrow('Unknown action type in UserReducer');
    });

    test('does not mutate the user it was given', () => {
        const before = user();

        userReducer(before, { type: UserActionType.AddConnectionId, payload: { connectionId: 'conn-b' } });

        expect(before.externalConnectionIds).toEqual(['conn-a']);
    });

    test.each([
        ['update username', { type: UserActionType.UpdateUsername, payload: { username: 'x' } }],
        ['update display name', { type: UserActionType.UpdateDisplayName, payload: { displayName: 'x' } }],
        ['update avatar', { type: UserActionType.UpdateAvatar, payload: { AvatarKey: 'x' } }],
        ['add connection id', { type: UserActionType.AddConnectionId, payload: { connectionId: 'x' } }],
        ['remove connection id', { type: UserActionType.RemoveConnectionId, payload: { connectionId: 'x' } }],
    ] as const)('%s with no user leaves the state null', (_, action) => {
        expect(userReducer(null, action)).toBeNull();
    });
});
