import React, { useEffect } from 'react';
import { Result } from '../../../Shared/Result/Result';
import { PendingContact } from '../../Models/PendingContact';
import {
    FriendRequestDto,
    GetFriendRequestsQuery,
} from '../../../Shared/Contracts/Friends/GetFriendRequests';
import { useNotifications } from '../Notification/NotificationContext';
import { useUser } from '../User/UserContext';
import { PendingContactContext } from './PendingContactContext';
import { PendingContactActionType, pendingContactReducer } from './PendingContactReducer';
import { NotificationActionType } from '../Notification/NotificationReducer';
import { usePendingContactEvents } from './PendingContactEvents';

const getFriendRequests = async (): Promise<PendingContact[]> => {
    const result = await window.electron.sendRequestAsync<Result<FriendRequestDto[]>>(new GetFriendRequestsQuery());

    if (!result.success || !result.data) return [];

    return result.data.map(
        (request) =>
            new PendingContact(request.userTag, request.username, false, request.displayName, request.avatarKey),
    );
};

export const PendingContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pendingContacts, pendingContactDispatch] = React.useReducer(pendingContactReducer, []);
    const { user } = useUser();
    const { notificationDispatch } = useNotifications();

    useEffect(() => {
        if (!user) {
            console.warn('User is not defined, cannot load pending contacts.');
            return;
        }
        async function load() {
            try {
                const loadedRequests = await getFriendRequests();
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
    }, [user, notificationDispatch]);

    usePendingContactEvents(pendingContactDispatch, notificationDispatch);

    return (
        <PendingContactContext.Provider value={{ pendingContacts, pendingContactDispatch }}>
            {children}
        </PendingContactContext.Provider>
    );
};
