import React, { useCallback, useEffect } from 'react';
import { AuthSessionActionType, authSessionReducer, initialAuthSessionState } from './AuthSessionReducer';
import { AuthSessionContext } from './AuthSessionContext';
import { useUser } from '../User/UserContext';
import { UserActionType } from '../User/UserReducer';
import { User } from '@/React/Models/User';
import { StartupCommand } from '@/Shared/Authentication/Startup';
import {v4 as uuid } from 'uuid';

export const AuthSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, authSessionDispatch] = React.useReducer(authSessionReducer, initialAuthSessionState);
    const { userDispatch } = useUser();
    const initializedRef = React.useRef(false);

    const initializeApp = useCallback(async (): Promise<boolean> => {
        try {
            const startUpResult = await window.electron.sendRequestAsync(new StartupCommand());
            if (!startUpResult.success) {
                console.error('Error during startup', startUpResult.errorMessage);
                return false;
            }

            if (!startUpResult.data.user) {
                console.log('No user found during startup');
                return false;
            }

            const user = startUpResult.data.user;
         
            userDispatch({
                type: UserActionType.Initialize,
                payload: new User(
                    user.id,
                    user.username,
                    user.tag,
                    user.deviceId,
                    user.connectionId,
                    user.externalConnectionIds,
                    user.avatarKey,
                    user.displayName,
                ),
            });

            return true;
        } catch (error: unknown) {
            console.error('Error getting device', error);
            return false;
        }
    }, [userDispatch]);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        (async () => {
            const loggedIn = await initializeApp();
            if (loggedIn) {
                authSessionDispatch({type: AuthSessionActionType.SetSessionId, payload: { sessionId: uuid().toString() }} );
            }
            authSessionDispatch({ type: AuthSessionActionType.SetLoading, payload: { loading: false } });
        })();
    }, [initializeApp]);

    return (
        <AuthSessionContext.Provider
            value={{
                sessionId: state.sessionId,
                loading: state.loading,
                authSessionDispatch,
            }}
        >
            {children}
        </AuthSessionContext.Provider>
    );
};
