import {SignalRClient} from "./SignalRClient.ts";
import {createContext} from "react";

interface SignalRContextProps {
    client: SignalRClient;
}

export const SignalRContext = createContext<SignalRContextProps | undefined>(undefined);


