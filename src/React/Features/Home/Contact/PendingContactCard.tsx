import React from 'react';
import { NotificationActionType } from '../../../Context/Notification/NotificationReducer.ts';
import NotificationBadge from '../../../Context/Notification/NotificationBadge.tsx';
import { useNotifications } from '../../../Context/Notification/NotificationContext.tsx';
import { useHomePage } from '../../../Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '../../../Context/HomePage/HomePageReducer.ts';
import { PendingContact } from '../../../Models/PendingContact.ts';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';

interface PendingContactCardProps {
    contact: PendingContact;
}

const PendingContactCard: React.FC<PendingContactCardProps> = ({ contact }) => {
    const name = contact.displayName ?? contact.username;
    const { selectedItem, homeDispatch } = useHomePage();
    const isSelected = selectedItem.type === 'pending' && selectedItem.value.id === contact.id;
    const { notificationDispatch } = useNotifications();

    const cardClasses = `flex items-center py-2 px-2 rounded-md cursor-pointer relative
    ${isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`;

    const onHandleClick = () => {
        if (isSelected) {
            homeDispatch({ type: HomePageActionType.Clear });
            return;
        }
        notificationDispatch({ type: NotificationActionType.RemoveFriendRequest, payload: { userTag: contact.id } });
        homeDispatch({
            type: HomePageActionType.SetSelectedPendingContact,
            payload: contact,
        });
    };

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            <NotificationBadge section="requests" itemId={contact.id} />
            <Avatar
                className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-media relative"
                AvatarKey={contact.avatarKey}
                Username={name}
            />
            <div className="ml-3">
                <div className="text-fg font-semibold">{name}</div>
            </div>
        </div>
    );
};

export default PendingContactCard;
