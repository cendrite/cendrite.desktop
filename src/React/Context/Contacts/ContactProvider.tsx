import React, {useCallback, useEffect, useMemo} from "react";
import { FriendSyncService } from '../../Common/Services/FriendSyncService';
import { ProfilePictureService } from '../../Common/Services/ProfilePictureService';
import { ContactContextActionType, contactReducer } from "./ContactReducer";
import { ContactContext } from "./ContactContext";
import { useUser } from "../User/UserContext";
import { useContactEvents } from "./ContactEvents";

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contacts, contactDispatch] = React.useReducer(contactReducer, []);
    const {user} = useUser();
    const friendSyncService = useMemo(() => new FriendSyncService(), []);
    const profilePictureService = useMemo(() => new ProfilePictureService(), []);

    const loadContacts = useCallback(async () => {
        if (!user) {
            console.warn("User is not defined, cannot load contacts.");
            return;
        }
        try {
            const loadedContacts = await friendSyncService.SyncFriends();
            contactDispatch({type: ContactContextActionType.Initialize, payload: loadedContacts});
            console.log("Contacts loaded from new provider:", loadedContacts);
        } catch (error) {
            console.error("Error loading contacts:", error);
        }
    }, [user, friendSyncService, contactDispatch]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    useContactEvents(user, contacts, contactDispatch, profilePictureService);

    return <ContactContext.Provider value={{ contacts, contactDispatch }}>
        {children}
    </ContactContext.Provider>;
};
