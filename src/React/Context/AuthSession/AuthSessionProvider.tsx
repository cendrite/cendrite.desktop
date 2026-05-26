import React, { useCallback, useEffect } from 'react';
import { AuthSessionActionType, authSessionReducer, initialAuthSessionState } from './AuthSessionReducer';
import { AuthSessionContext } from './AuthSessionContext';
import { useUser } from '../User/UserContext';
import { Result } from '../../../Shared/Result/Result';
import { GetDeviceDto } from '../../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceDto';
import { GetDeviceQuery } from '../../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceQuery';
import { GetUserDto } from '../../../Electron/Application/Features/User/Queries/GetUserDto';
import { GetUserQuery } from '../../../Electron/Application/Features/User/Queries/GetUserQuery';
import { TokenManager } from '../../Security/Tokens/TokenManager';
import { UserActionType } from '../User/UserReducer';
import { User } from '../../Models/User';
import {v4 as uuid } from 'uuid';

export const AuthSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, authSessionDispatch] = React.useReducer(authSessionReducer, initialAuthSessionState);
    const { userDispatch } = useUser();
    const initializedRef = React.useRef(false);

    const initializeApp = useCallback(async (): Promise<boolean> => {
        try {
            const deviceResult = await window.electron.sendRequestAsync<Result<GetDeviceDto>>(new GetDeviceQuery());
            if (!deviceResult.success) {
                console.log('Error getting device', deviceResult.errorMessage);
                return false;
            }

            const userResult = await window.electron.sendRequestAsync<Result<GetUserDto>>(new GetUserQuery());
            if (!userResult.success) {
                return false;
            }

            const tokenManager = TokenManager.getInstance();
            await tokenManager.initialize(userResult.data!.id, deviceResult.data!.id);

            userDispatch({
                type: UserActionType.Initialize,
                payload: new User(
                    userResult.data!.id,
                    userResult.data!.username,
                    userResult.data!.userTag,
                    deviceResult.data!.id,
                    deviceResult.data!.connectionId,
                    userResult.data!.externalConnectionIds,
                    userResult.data!.avatarKey,
                    userResult.data!.displayName,
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
