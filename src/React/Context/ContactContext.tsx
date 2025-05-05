import React, {useCallback, useEffect, useMemo} from "react";
import {FriendService} from "../Common/Services/FriendService.ts";
import {useUser} from "./UserContext.tsx";
import {FriendRequestAcceptedEvent} from "../SignalR/ChangeEvent/EventData.ts";
import {ChangeEventType} from "../SignalR/ChangeEvent/ChangeEventType.ts";
import {useSignalEvent} from "../SignalR/Utility/Utilities.ts";
import {ChangeEvent} from "../SignalR/ChangeEvent/ChangeEvent.ts";
import {ProfilePictureService} from "../Common/Services/ProfilePictureService.ts";
import {Result} from "../../Shared/Result/Result.ts";
import {CreateFriendCommand} from "../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand.ts";

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
    refreshContacts: () => Promise<void>;
}

const ContactContext = React.createContext<ContactContextType | undefined>(undefined);

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    const friendService = useMemo(() => new FriendService(), []);
    const profilePictureService = useMemo(() => new ProfilePictureService(), []);
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

    const handleContactAddedEvent = useCallback(async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
        const existingContact = contacts.find(contact => contact.id === evt.data.tag);
        if (existingContact) {
            return;
        }
        const profilePicture = evt.data.profilePictureUrl ? await profilePictureService.FetchProfilePicture(evt.data.profilePictureUrl) : null;

        const newContact = new Contact(
            evt.data.tag,
            evt.data.username,
            evt.data.displayName,
            profilePicture,
            evt.data.connectionIds
        );

        await window.electron.sendRequestAsync<Result>(new CreateFriendCommand(newContact.username, newContact.displayName, newContact.connectionIds, newContact.id, profilePicture));

        setContacts((prevContacts) => {
            return [...prevContacts, newContact];
        });
    }, [friendService, user]);

    useSignalEvent<FriendRequestAcceptedEvent>(ChangeEventType.FriendRequestAccepted, handleContactAddedEvent);

    return (
        <ContactContext.Provider value={{ contacts, setContacts, refreshContacts }}>
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