// src/components/NotificationBadge.tsx
import React from 'react';
import { useNotifications } from './NotificationContext.tsx';

export interface NotificationBadgeProps {
    section: 'sidebar' | 'contacts' | 'requests' | 'chats';
    itemId?: string | null;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ section, itemId = null }) => {
    const { state } = useNotifications();
    let count: number | undefined = undefined;

    switch (section) {
        case 'sidebar':
            count = state.count.sidebar;
            break;
        case 'contacts':
            count = state.count.friendRequests;
            break;
        case 'requests':
            count = state.count.friendRequests;
            break;
        case 'chats':
            count = state.count.chats;
            break;
    }

    if (itemId) {
        if (section === 'requests') {
            const found = state.friendRequestNotifications.find((n) => n.userTag === itemId);
            if (!found) return null;

            return (
                <span className="absolute right-5 top-1/2 -translate-y-1/2 translate-x-1.5 z-10">
                    <span className="flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-darkGray-300" />
                    </span>
                </span>
            );
        }
    }

    console.log('NotificationBadge section:', section);
    console.log('NotificationBadge count:', count);
    if (!count || count <= 0) return null;

    const display = count > 99 ? '99+' : String(count);
    return (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-xs font-bold">
            {itemId === undefined || itemId === null ? display : ''}
        </span>
    );
};

export default NotificationBadge;
