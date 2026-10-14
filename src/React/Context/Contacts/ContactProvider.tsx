import React, {useCallback, useEffect} from "react";
import { ContactActionType, contactReducer } from "./ContactReducer";
import { ContactContext } from "./ContactContext";
import { useUser } from "../User/UserContext";
import { useContactEvents } from "./ContactEvents";
import { Result } from "../../../Shared/Result/Result";
import { Contact } from "../../Models/Contact";
import { FriendContract } from "../../../Shared/Models/FriendContract";
import { SyncFriendsQuery } from "../../../Shared/Friends/SyncFriends";

const syncFriends = async (): Promise<Contact[]> => {
    const result = await window.electron.sendRequestAsync<Result<FriendContract[]>>(new SyncFriendsQuery());

    if (!result.success || !result.data) return [];

    return result.data.map(
        (friend) => new Contact(friend.id, friend.username, friend.displayName, friend.avatarKey, friend.connectionIds),
    );
};

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contacts, contactDispatch] = React.useReducer(contactReducer, []);
    const {user} = useUser();

    const loadContacts = useCallback(async () => {
        if (!user) {
            console.warn("User is not defined, cannot load contacts.");
            return;
        }
        try {
            const loadedContacts = await syncFriends();
            contactDispatch({type: ContactActionType.Initialize, payload: loadedContacts});
            console.log("Contacts loaded from new provider:", loadedContacts);
        } catch (error) {
            console.error("Error loading contacts:", error);
        }
    }, [user, contactDispatch]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    useContactEvents(user, contacts, contactDispatch);

    return <ContactContext.Provider value={{ contacts, contactDispatch }}>
        {children}
    </ContactContext.Provider>;
};
