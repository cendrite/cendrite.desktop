import { useCallback } from 'react';
import { CreateFriendCommand } from '../../../Shared/Friends/CreateFriend.js';
import { Contact } from '../../Models/Contact';
import { User } from '../../Models/User';
import { ContactAction, ContactActionType } from './ContactReducer';
import { getById } from './ContactSelectors';
import { DeleteFriendCommand } from '../../../Shared/Friends/DeleteFriend.js';
import { RemoveFriendConnectionIdCommand } from '../../../Shared/Friends/RemoveFriendConnectionId.js';
import { AddFriendConnectionIdCommand } from '../../../Shared/Friends/AddFriendConnectionId.js';
import { ChangeEvent } from '../../../Shared/Events/ChangeEvent';
import { FriendDeletedEvent, FriendRequestAcceptedEvent, UserLoggedInEvent, UserLoggedOutEvent } from '../../../Shared/Events/EventData';
import { ChangeEventType } from '../../../Shared/Events/ChangeEventType';
import { useSignalEvent } from '../../Common/Utilities';

export function useContactEvents(
    user: User | null,
    contacts: Contact[],
    dispatch: React.Dispatch<ContactAction>,
) {
    const handleContactAddedEvent = useCallback(
        async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
            const existingContact = getById(contacts, evt.data.tag);
            if (existingContact) {
                return;
            }
            const newContact = {
                id: evt.data.tag,
                username: evt.data.username,
                displayName: evt.data.displayName,
                connectionIds: evt.data.connectionIds,
                avatarKey: evt.data.avatarKey,
            };
            await window.electron.sendRequestAsync(
                new CreateFriendCommand(
                    newContact.username,
                    newContact.displayName,
                    newContact.connectionIds,
                    newContact.id,
                    newContact.avatarKey,
                ),
            );

            dispatch({ type: ContactActionType.Add, payload: newContact });
        },
        [getById, dispatch],
    );

    const handleContactDeletedEvent = useCallback(
        async (evt: ChangeEvent<FriendDeletedEvent>) => {
            if (user?.userTag === evt.data.tag) {
                await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.deletedBy, true));
                dispatch({ type: ContactActionType.Remove, payload: { id: evt.data.deletedBy } });
                return;
            }

            await window.electron.sendRequestAsync(new DeleteFriendCommand(evt.data.tag, true));
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
