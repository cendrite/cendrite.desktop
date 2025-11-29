import { useCallback } from 'react';
import { CreateFriendCommand } from '../../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand';
import { ProfilePictureService } from '../../Common/Services/ProfilePictureService';
import { Contact } from '../../Models/Contact';
import { User } from '../../Models/User';
import { ChangeEvent } from '../../SignalR/ChangeEvent/ChangeEvent';
import {
    FriendDeletedEvent,
    FriendRequestAcceptedEvent,
    UserLoggedInEvent,
    UserLoggedOutEvent,
} from '../../SignalR/ChangeEvent/EventData';
import { ContactAction, ContactActionType } from './ContactReducer';
import { getById } from './ContactSelectors';
import { DeleteFriendCommand } from '../../../Electron/Application/Features/Friends/Commands/Delete/DeleteFriendCommand';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { ChangeEventType } from '../../SignalR/ChangeEvent/ChangeEventType';
import { RemoveFriendConnectionIdCommand } from '../../../Electron/Application/Features/Friends/Commands/RemoveConnectionId/RemoveFriendConnectionIdCommand';
import { AddFriendConnectionIdCommand } from '../../../Electron/Application/Features/Friends/Commands/AddConnectionId/AddFriendConnectionIdCommand';

export function useContactEvents(
    user: User | null,
    contacts: Contact[],
    dispatch: React.Dispatch<ContactAction>,
    profilePictureService: ProfilePictureService,
) {
    const handleContactAddedEvent = useCallback(
        async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
            const existingContact = getById(contacts, evt.data.tag);
            if (existingContact) {
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
            await window.electron.sendRequestAsync(
                new CreateFriendCommand(
                    newContact.username,
                    newContact.displayName,
                    newContact.connectionIds,
                    newContact.id,
                    newContact.profilePicture,
                ),
            );

            dispatch({ type: ContactActionType.Add, payload: newContact });
        },
        [getById, profilePictureService, dispatch],
    );

    const handleContactDeletedEvent = useCallback(
        async (evt: ChangeEvent<FriendDeletedEvent>) => {
            if (user?.userTag === evt.data.tag) {
                await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.deletedBy));
                dispatch({ type: ContactActionType.Remove, payload: { id: evt.data.deletedBy } });
                return;
            }

            await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.tag));
            dispatch({ type: ContactActionType.Remove, payload: { id: evt.data.tag } });
        },
        [user, dispatch],
    );

    const handleContactLoginEvent = useCallback(
        async (evt: ChangeEvent<UserLoggedInEvent>) => {
            try {
                if (!isContactEvent(evt.data.userTag)) return;
                console.log(`Contact ${evt.data.userTag} logged in with connection ID ${evt.data.connectionId}`);
                dispatch({
                    type: ContactActionType.AddConnectionId,
                    payload: { id: evt.data.userTag, connectionId: evt.data.connectionId },
                });
                await window.electron.sendRequestAsync(new AddFriendConnectionIdCommand(evt.data.userTag, evt.data.connectionId));
            } catch (err) {
                console.error('Error handling contact login event', err);
            }
        },
        [dispatch, contacts],
    );

    const handleContactLogoutEvent = useCallback(
        async (evt: ChangeEvent<UserLoggedOutEvent>) => {
            try {
                if (!isContactEvent(evt.data.userTag)) return;
                console.log(`Contact ${evt.data.userTag} logged out with connection ID ${evt.data.connectionId}`);
                dispatch({
                    type: ContactActionType.RemoveConnectionId,
                    payload: { id: evt.data.userTag, connectionId: evt.data.connectionId },
                });
                await window.electron.sendRequestAsync(new RemoveFriendConnectionIdCommand(evt.data.userTag, evt.data.connectionId));
            } catch (err) {
                console.error('Error handling contact login event', err);
            }
        },
        [dispatch, contacts],
    );

    useSignalEvent<FriendDeletedEvent>(ChangeEventType.FriendRemoved, handleContactDeletedEvent);
    useSignalEvent<FriendRequestAcceptedEvent>(ChangeEventType.FriendRequestAccepted, handleContactAddedEvent);
    useSignalEvent<UserLoggedInEvent>(ChangeEventType.UserLoggedIn, handleContactLoginEvent);
    useSignalEvent<UserLoggedOutEvent>(ChangeEventType.UserLoggedOut, handleContactLogoutEvent);

    function isContactEvent(tag: string): boolean {
        if(!getById(contacts, tag)) {
            console.log('Contact event for unknown contact received, ignoring.');
            return false;
        }
        return true;
    }
}
