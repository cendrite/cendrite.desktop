import React, {useEffect} from "react";
import {FriendService} from "../Common/Services/FriendService.ts";
import {useUser} from "./UserContext.tsx";

export class PendingContact {
    id: string;
    username: string;
    displayName: string | null;
    profilePicture: string | null;

    constructor(id: string, username: string, displayName: string | null, profilePicture: string | null) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.profilePicture = profilePicture;
    }
}

interface FriendRequestContextType {
    pendingContacts: PendingContact[];
    setPendingContacts: React.Dispatch<React.SetStateAction<PendingContact[]>>;
}

const PendingContactsContext = React.createContext<FriendRequestContextType | undefined>(undefined);

export const PendingContactProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [pendingContacts, setPendingContacts] = React.useState<PendingContact[]>([]);
    const friendService = React.useMemo(() => new FriendService(), []);
    const {user} = useUser();

    const loadPendingContacts = async () => {
        if (!user) {
            console.warn("User is not defined, cannot load pending contacts.");
            return;
        }

        try {
            const loadedRequests = await friendService.GetFriendRequests(user.id);
            setPendingContacts(loadedRequests);
        } catch (error) {
            console.error("Error loading pending contacts:", error);
        }
    }

    useEffect(() => {
        loadPendingContacts();
    }, [user]);

    return (
        <PendingContactsContext.Provider value={{pendingContacts, setPendingContacts}}>
            {children}
        </PendingContactsContext.Provider>
    );
};

export const usePendingContacts = () => {
    const context = React.useContext(PendingContactsContext);
    if (!context) {
        throw new Error("useContacts must be used within a ContactProvider");
    }
    return context;
};