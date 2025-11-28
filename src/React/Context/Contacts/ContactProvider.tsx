import React, {useCallback, useEffect, useMemo} from "react";
import { ContactContext, useContacts } from './ContactContext';
import { FriendSyncService } from '../../Common/Services/FriendSyncService';
import { ProfilePictureService } from '../../Common/Services/ProfilePictureService';
import { useUser } from '../UserContext';
import { ContactContextActionType } from "./ContactReducer";
import { FriendDeletedEvent, FriendRequestAcceptedEvent } from "../../SignalR/ChangeEvent/EventData";
import { DeleteFriendCommand } from "../../../Electron/Application/Features/Friends/Commands/Delete/DeleteFriendCommand";
import { ChangeEvent } from "../../SignalR/ChangeEvent/ChangeEvent";
import { useSignalEvent } from "../../SignalR/Utility/Utilities";
import { ChangeEventType } from "../../SignalR/ChangeEvent/ChangeEventType";
import { CreateFriendCommand } from "../../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand";

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { contacts, contactDispatch, getById } = useContacts();
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

    const handleContactAddedEvent = useCallback(async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
        const existingContact = getById(evt.data.tag);
        if(existingContact) {
            return;
        }
        const profilePicture = evt.data.profilePictureUrl 
            ? await profilePictureService.FetchProfilePicture(evt.data.profilePictureUrl) 
            : null;

        const newContact = {
            id: evt.data.tag,
            username: evt.data.username,
            displayName: evt.data.displayName,
            profilePicture: profilePicture,
            connectionIds: evt.data.connectionIds, 
        };
        await window.electron.sendRequestAsync(new CreateFriendCommand(
            newContact.username, 
            newContact.displayName, 
            newContact.connectionIds, 
            newContact.id, 
            newContact.profilePicture));

        contactDispatch({type: ContactContextActionType.Add, payload: newContact});
    }, [getById, profilePictureService, contactDispatch]);

    const handleContactDeletedEvent = useCallback(async (evt: ChangeEvent<FriendDeletedEvent>) => {
        if(user?.userTag === evt.data.tag) {
            await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.deletedBy));
            contactDispatch({type: ContactContextActionType.Remove, payload: {id: evt.data.deletedBy}});
            return;
        }

        await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.tag));
        contactDispatch({type: ContactContextActionType.Remove, payload: {id: evt.data.tag}});
    }, [user, contactDispatch]);


    useSignalEvent<FriendDeletedEvent>(ChangeEventType.FriendRemoved, handleContactDeletedEvent);
    useSignalEvent<FriendRequestAcceptedEvent>(ChangeEventType.FriendRequestAccepted, handleContactAddedEvent);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    return <ContactContext.Provider value={{ contacts, contactDispatch }}>
        {children}
    </ContactContext.Provider>;
};
