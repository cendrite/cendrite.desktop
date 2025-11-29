import { useCallback } from 'react';
import { CreateFriendCommand } from '../../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand';
import { ProfilePictureService } from '../../Common/Services/ProfilePictureService';
import { Contact } from '../../Models/Contact';
import { User } from '../../Models/User';
import { ChangeEvent } from '../../SignalR/ChangeEvent/ChangeEvent';
import { FriendDeletedEvent, FriendRequestAcceptedEvent } from '../../SignalR/ChangeEvent/EventData';
import { ContactContextAction, ContactContextActionType } from './ContactReducer';
import { getById } from './ContactSelectors';
import { DeleteFriendCommand } from '../../../Electron/Application/Features/Friends/Commands/Delete/DeleteFriendCommand';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { ChangeEventType } from '../../SignalR/ChangeEvent/ChangeEventType';

export function useContactEvents(
    user: User | null,
    contacts: Contact[],
    dispatch: React.Dispatch<ContactContextAction>,
    profilePictureService: ProfilePictureService,
) { 
    const handleContactAddedEvent = useCallback(async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
        const existingContact = getById(contacts, evt.data.tag);
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

        dispatch({type: ContactContextActionType.Add, payload: newContact});
    }, [getById, profilePictureService, dispatch]);

    const handleContactDeletedEvent = useCallback(async (evt: ChangeEvent<FriendDeletedEvent>) => {
        if(user?.userTag === evt.data.tag) {
            await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.deletedBy));
            dispatch({type: ContactContextActionType.Remove, payload: {id: evt.data.deletedBy}});
            return;
        }

        await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.tag));
        dispatch({type: ContactContextActionType.Remove, payload: {id: evt.data.tag}});
    }, [user, dispatch]);

    useSignalEvent<FriendDeletedEvent>(ChangeEventType.FriendRemoved, handleContactDeletedEvent);
    useSignalEvent<FriendRequestAcceptedEvent>(ChangeEventType.FriendRequestAccepted, handleContactAddedEvent);
}
