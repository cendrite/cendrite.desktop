import React, {createContext, useContext, useEffect} from "react";
import {SignalManager} from "./SignalManager.ts";
import { useAuthSession } from "../Context/AuthSession/AuthSessionContext.tsx";

interface SignalRContextProps {
    client: SignalManager;
}

const SignalRContext = createContext<SignalRContextProps | undefined>(undefined);

export const SignalRProvider = ({children}: { children: React.ReactNode }) => {
    const client = SignalManager.getInstance();
    const {sessionId} = useAuthSession();

    useEffect(() => {
        if (!sessionId) {
            client.disconnect();
            return;
        }
        client.connect()
            .then(() =>{})
            .catch((error: Error) => console.log("Failed to connect to SignalR", error));
    }, [sessionId, client]);

    return (
        <SignalRContext.Provider value={{client}}>
            {children}
        </SignalRContext.Provider>
    );
};


export const useSignal = () => {
    const context = useContext(SignalRContext);

    if (context === undefined) {
        throw new Error("useSignal must be used within a SignalRProvider");
    }

    return context;
};
