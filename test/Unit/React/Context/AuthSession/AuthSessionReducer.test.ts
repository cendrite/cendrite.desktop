import { describe, expect, test } from 'vitest';
import {
    AuthSessionAction,
    AuthSessionActionType,
    authSessionReducer,
    initialAuthSessionState,
} from '../../../../../src/React/Context/AuthSession/AuthSessionReducer.ts';

describe('authSessionReducer', () => {
    test('initialize sets the session id and keeps the loading flag', () => {
        const loading = { sessionId: null, loading: true };

        const state = authSessionReducer(loading, {
            type: AuthSessionActionType.Initialize,
            payload: { sessionId: 's1' },
        });

        expect(state).toEqual({ sessionId: 's1', loading: true });
    });

    test('initialize accepts a null session id', () => {
        const state = authSessionReducer(
            { sessionId: 's1', loading: false },
            { type: AuthSessionActionType.Initialize, payload: { sessionId: null } },
        );

        expect(state.sessionId).toBeNull();
    });

    test('set session id replaces the id and keeps the loading flag', () => {
        const state = authSessionReducer(
            { sessionId: 's1', loading: true },
            { type: AuthSessionActionType.SetSessionId, payload: { sessionId: 's2' } },
        );

        expect(state).toEqual({ sessionId: 's2', loading: true });
    });

    test('set loading replaces the flag and keeps the session id', () => {
        const state = authSessionReducer(
            { sessionId: 's1', loading: false },
            { type: AuthSessionActionType.SetLoading, payload: { loading: true } },
        );

        expect(state).toEqual({ sessionId: 's1', loading: true });
    });

    test('clear drops the session and the loading flag', () => {
        const state = authSessionReducer(
            { sessionId: 's1', loading: true },
            { type: AuthSessionActionType.Clear },
        );

        expect(state).toEqual(initialAuthSessionState);
    });

    test('an unknown action throws', () => {
        const unknown = { type: 99 } as unknown as AuthSessionAction;

        expect(() => authSessionReducer(initialAuthSessionState, unknown)).toThrow(
            'Unknown action type in AuthSessionReducer',
        );
    });
});
