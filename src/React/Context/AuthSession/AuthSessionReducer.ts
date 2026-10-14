
import { unknownAction } from '../unknownAction.ts';

export enum AuthSessionActionType {
    Initialize = -1,
    SetSessionId = 0,
    SetLoading = 1,
    Clear = 2,
}

export type AuthSessionAction =
    | { type: AuthSessionActionType.Initialize; payload: { sessionId: string | null } }
    | { type: AuthSessionActionType.SetSessionId; payload: { sessionId: string } }
    | { type: AuthSessionActionType.SetLoading; payload: { loading: boolean } }
    | { type: AuthSessionActionType.Clear };

export interface AuthSessionState {
    sessionId: string | null;
    loading: boolean;
}

export const initialAuthSessionState: AuthSessionState = {
    sessionId: null,
    loading: false,
};

export function authSessionReducer(
    state: AuthSessionState,
    action: AuthSessionAction,
): AuthSessionState {
    switch (action.type) {
        case AuthSessionActionType.Initialize:
            return { ...state, sessionId: action.payload.sessionId };

        case AuthSessionActionType.SetSessionId:
            return { ...state, sessionId: action.payload.sessionId };

        case AuthSessionActionType.SetLoading:
            return { ...state, loading: action.payload.loading };

        case AuthSessionActionType.Clear:
            return { sessionId: null, loading: false };

        default:
            return unknownAction('AuthSessionReducer', action);
    }
}

