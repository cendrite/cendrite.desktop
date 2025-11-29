import React, { useEffect } from 'react';
import { FriendService } from '../../Common/Services/FriendService';
import { useNotifications } from '../Notification/NotificationContext';
import { useUser } from '../User/UserContext';
import { PendingContactContext } from './PendingContactContext';
import { PendingContactActionType, pendingContactReducer } from './PendingContactReducer';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { usePendingContactEvents } from './PendingContactEvents';

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
                pendingContactDispatch({ type: PendingContactActionType.Initialize, payload: loadedRequests });
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

    usePendingContactEvents(pendingContactDispatch, notificationDispatch);

    return (
        <PendingContactContext.Provider value={{ pendingContacts, pendingContactDispatch }}>
            {children}
        </PendingContactContext.Provider>
    );
};
