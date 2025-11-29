import React, { useCallback, useEffect } from 'react';
import { FriendService } from '../../Common/Services/FriendService';
import { useNotifications } from '../Notification/NotificationContext';
import { useUser } from '../User/UserContext';
import { PendingContactContext } from './PendingContactContext';
import { PendingContactContextActionType, pendingContactReducer } from './PendingContactReducer';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { PendingContact } from '../../Models/PendingContact';
import { ChangeEvent } from '../../SignalR/ChangeEvent/ChangeEvent';
import { FriendRequestAcceptedEvent, FriendRequestEvent } from '../../SignalR/ChangeEvent/EventData';
import { useSignalEvent } from '../../SignalR/Utility/Utilities';
import { ChangeEventType } from '../../SignalR/ChangeEvent/ChangeEventType';

export const PendingContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pendingContacts, pendingContactDispatch] = React.useReducer(pendingContactReducer, []);
    const friendService = React.useMemo(() => new FriendService(), []);
    const { user } = useUser();
    const { notificationDispatch } = useNotifications();

    useEffect(() => {
        if (!user) {
            console.warn('User is not defined, cannot load pending contacts.');
            return;
        }
        async function load() {
            try {
                const loadedRequests = await friendService.GetFriendRequests();
                pendingContactDispatch({ type: PendingContactContextActionType.Initialize, payload: loadedRequests });
                loadedRequests.forEach((r) =>
                    notificationDispatch({ type: NotificationActionType.AddFriendRequest, payload: { userTag: r.id } }),
                );
            } catch (error) {
                console.error('Error loading pending contacts:', error);
            }
        }
        load().catch((err) => {
            console.log('Error loading pending contacts', err);
        });
    }, [user, notificationDispatch, friendService]);

    const handleFriendRequestReceived = useCallback(async (evt: ChangeEvent<FriendRequestEvent>) => {
        console.log("Friend request received", evt.data);
        pendingContactDispatch({ type: PendingContactContextActionType.Add, payload: new PendingContact(evt.data.tag, evt.data.username, false, evt.data.displayName, evt.data.presignedProfilePictureUrl) });
        notificationDispatch({ type: NotificationActionType.AddFriendRequest, payload: { userTag: evt.data.tag } });
    }, [notificationDispatch]);

    const handleFriendRequestRejected = useCallback(async (evt: ChangeEvent<FriendRequestEvent>) => {
        pendingContactDispatch({ type: PendingContactContextActionType.Remove, payload: { id: evt.data.tag } });
        notificationDispatch({ type: NotificationActionType.RemoveFriendRequest, payload: { userTag: evt.data.tag } });
    }, [notificationDispatch]);

    const handleFriendRequestAcceptedEvent = useCallback(async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
        pendingContactDispatch({ type: PendingContactContextActionType.Remove, payload: { id: evt.data.tag } });
        notificationDispatch({ type: NotificationActionType.RemoveFriendRequest, payload: { userTag: evt.data.tag } });
    }, [notificationDispatch]);

    useSignalEvent<FriendRequestEvent>(ChangeEventType.FriendRequest, handleFriendRequestReceived);
    useSignalEvent<FriendRequestEvent>(ChangeEventType.FriendRequestRejected, handleFriendRequestRejected);
    useSignalEvent<FriendRequestAcceptedEvent>(ChangeEventType.FriendRequestAccepted, handleFriendRequestAcceptedEvent);



    return (
        <PendingContactContext.Provider value={{ pendingContacts, pendingContactDispatch }}>
            {children}
        </PendingContactContext.Provider>
    );
};
