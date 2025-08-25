import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Result } from "../../Shared/Result/Result";
import { GetDeviceDto } from "../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceDto";
import { GetDeviceQuery } from "../../Electron/Application/Features/Device/Queries/GetDevice/GetDeviceQuery";
import { GetUserDto } from "../../Electron/Application/Features/User/Queries/GetUserDto.ts";
import { GetUserQuery } from "../../Electron/Application/Features/User/Queries/GetUserQuery.ts";
import { useUser } from "./UserContext.tsx";
import {TokenManager} from "../Security/Tokens/TokenManager.ts";

interface AuthContextType {
    isLoggedIn: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const initializedRef = useRef(false);
    const { setUser } = useUser();

    const initializeApp = useCallback(async (): Promise<boolean> => {
        try {
            const deviceResult = await window.electron.sendRequestAsync<Result<GetDeviceDto>>(new GetDeviceQuery());
            if (!deviceResult.success) {
                console.log("Error getting device", deviceResult.errorMessage);
                return false;
            }

            const userResult = await window.electron.sendRequestAsync<Result<GetUserDto>>(new GetUserQuery());
            if (!userResult.success) {
                return false;
            }

            const tokenManager = TokenManager.getInstance();
            await tokenManager.initialize(userResult.data!.id, deviceResult.data!.id);

            setUser({ ...userResult.data!, deviceId: deviceResult.data!.id, connectionId: deviceResult.data!.connectionId });
            return true;
        } catch (error: unknown) {
            console.error("Error getting device", error);
            return false;
        }
    }, [setUser]);

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
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
};
