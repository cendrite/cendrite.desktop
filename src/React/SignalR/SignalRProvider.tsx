import React, {createContext, useContext, useEffect} from "react";
import { useAuth } from "../Context/AuthContext";
import {SignalManager} from "./SignalManager.ts";

interface SignalRContextProps {
    client: SignalManager;
}

const SignalRContext = createContext<SignalRContextProps | undefined>(undefined);

export const SignalRProvider = ({children}: { children: React.ReactNode }) => {
    const client = SignalManager.getInstance();
    const {isLoggedIn} = useAuth();

    useEffect(() => {
        if (!isLoggedIn) return;
        client.connect()
            .then(() =>{})
            .catch((error: Error) => console.log("Failed to connect to SignalR", error));
    }, [isLoggedIn, client]);

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
