import {SignalRClient} from "./SignalRClient.ts";
import {createContext, useContext, useEffect} from "react";
import {useAuth} from "../Common/Context/AuthContext.tsx";

interface SignalRContextProps {
    client: SignalRClient;
}

const SignalRContext = createContext<SignalRContextProps | undefined>(undefined);

export const SignalRProvider = ({children}: { children: React.ReactNode }) => {
    const client = SignalRClient.getInstance();
    const {isLoggedIn} = useAuth();

    useEffect(() => {
        if (!isLoggedIn) return;
        client.connect()
            .then(() => console.log("Connected to SignalR"))
            .catch((error) => console.log("Failed to connect to SignalR", error));
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
