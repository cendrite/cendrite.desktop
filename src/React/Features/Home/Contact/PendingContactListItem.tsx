import React from 'react';
import { NotificationActionType } from '../../../Context/Notification/NotificationReducer.ts';
import NotificationBadge from '../../../Context/Notification/NotificationBadge.tsx';
import { useNotifications } from '../../../Context/Notification/NotificationContext.tsx';
import { useHomePage } from '../../../Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '../../../Context/HomePage/HomePageReducer.ts';
import { PendingContact } from '../../../Models/PendingContact.ts';
import ContactCard from '../../../Common/Components/Cards/ContactCard.tsx';

interface PendingContactListItemProps {
    contact: PendingContact;
}

const PendingContactListItem: React.FC<PendingContactListItemProps> = ({ contact }) => {
    const { selectedItem, homeDispatch } = useHomePage();
    const isSelected = selectedItem.type === 'pending' && selectedItem.value.id === contact.id;
    const { notificationDispatch } = useNotifications();

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
        <ContactCard
            contact={contact}
            selected={isSelected}
            onClick={onHandleClick}
            trailing={<NotificationBadge section="requests" itemId={contact.id} />}
        />
    );
};

export default PendingContactListItem;
