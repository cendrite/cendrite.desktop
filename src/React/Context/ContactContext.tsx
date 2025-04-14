import React, {useCallback, useEffect, useMemo} from "react";
import {FriendService} from "../Common/Services/FriendService.ts";
import {useUser} from "./UserContext.tsx";

export class Contact {
    id: string;
    username: string;
    displayName: string | null;
    profilePicture: string | null;
    connectionIds: string[];

    constructor(id: string, username: string, displayName: string | null, profilePicture: string | null, connectionIds: string[]) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.profilePicture = profilePicture;
        this.connectionIds = connectionIds;
    }
}

interface ContactContextType {
    contacts: Contact[];
    setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
    refreshContacts: () => void;
}

const ContactContext = React.createContext<ContactContextType | undefined>(undefined);

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    const friendService = useMemo(() => new FriendService(), []);
    const {user} = useUser();

    const loadContacts = useCallback(async () => {
        if (!user) {
            console.warn("User is not defined, cannot load contacts.");
            return;
        }
        try {
            const loadedContacts = await friendService.GetFriends(user.id);
            setContacts(loadedContacts);
        } catch (error) {
            console.error("Error loading contacts:", error);
        }
    }, [user, friendService]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    const refreshContacts = async () => {
        await loadContacts();
    };

    return (
        <ContactContext.Provider value={{ contacts, setContacts,refreshContacts }}>
            {children}
        </ContactContext.Provider>
    );
};

export const useContacts = () => {
    const context = React.useContext(ContactContext);
    if (!context) {
        throw new Error("useContacts must be used within a ContactProvider");
    }
    return context;
};