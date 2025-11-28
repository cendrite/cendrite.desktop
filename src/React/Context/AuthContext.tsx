import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Result } from '../../Shared/Result/Result';
import { GetDeviceDto } from '../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceDto';
import { GetDeviceQuery } from '../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceQuery';
import { GetUserDto } from '../../Electron/Application/Features/User/Queries/GetUserDto.ts';
import { GetUserQuery } from '../../Electron/Application/Features/User/Queries/GetUserQuery.ts';
import { TokenManager } from '../Security/Tokens/TokenManager.ts';
import { useUser } from './User/UserContext.tsx';
import { UserContextActionType } from './User/UserReducer.ts';
import { User } from '../Models/User.ts';

interface AuthContextType {
    isLoggedIn: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const initializedRef = useRef(false);
    const { userDispatch } = useUser();

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

            userDispatch({type: UserContextActionType.Initialize, payload: new User(
                userResult.data!.id,
                userResult.data!.username,
                userResult.data!.userTag,
                deviceResult.data!.id,
                deviceResult.data!.connectionId,
                userResult.data!.externalConnectionIds,
                userResult.data!.base64ProfilePicture,
                userResult.data!.displayName,
            )});

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
            setIsLoggedIn(loggedIn);
            setLoading(false);
        })();
    }, [initializeApp]);

    return <AuthContext.Provider value={{ isLoggedIn, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
