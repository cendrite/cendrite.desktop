import { useCallback } from 'react';
import { PendingContact } from '../../Models/PendingContact';
import { NotificationAction, NotificationActionType } from '../Notification/NotificationReducer';
import { PendingContactAction, PendingContactActionType } from './PendingContactReducer';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { ChangeEvent } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEvent';
import { FriendRequestAcceptedEvent, FriendRequestEvent } from '../../../Electron/Infrastructure/Signal/ChangeEvent/EventData';
import { ChangeEventType } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEventType';

export function usePendingContactEvents(
    pendingContactDispatch: React.Dispatch<PendingContactAction>,
    notificationDispatch: React.Dispatch<NotificationAction>,
) {
    const handleFriendRequestReceived = useCallback(
        async (evt: ChangeEvent<FriendRequestEvent>) => {
            console.log('Received friend request event:', evt);
            pendingContactDispatch({
                type: PendingContactActionType.Add,
                payload: new PendingContact(
                    evt.data.tag,
                    evt.data.username,
                    false,
                    evt.data.displayName,
                    evt.data.avatarKey,
                ),
            });
            notificationDispatch({ type: NotificationActionType.AddFriendRequest, payload: { userTag: evt.data.tag } });
        },
        [notificationDispatch],
    );

    const handleFriendRequestRejected = useCallback(
        async (evt: ChangeEvent<FriendRequestEvent>) => {
            pendingContactDispatch({ type: PendingContactActionType.Remove, payload: { id: evt.data.tag } });
            notificationDispatch({
                type: NotificationActionType.RemoveFriendRequest,
                payload: { userTag: evt.data.tag },
            });
        },
        [notificationDispatch],
    );

    const handleFriendRequestAcceptedEvent = useCallback(
        async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
            pendingContactDispatch({ type: PendingContactActionType.Remove, payload: { id: evt.data.tag } });
            notificationDispatch({
                type: NotificationActionType.RemoveFriendRequest,
                payload: { userTag: evt.data.tag },
            });
        },
        [notificationDispatch],
    );

    useSignalEvent<FriendRequestEvent>(ChangeEventType.FriendRequest, handleFriendRequestReceived);
    useSignalEvent<FriendRequestEvent>(ChangeEventType.FriendRequestRejected, handleFriendRequestRejected);
    useSignalEvent<FriendRequestAcceptedEvent>(ChangeEventType.FriendRequestAccepted, handleFriendRequestAcceptedEvent);
}
