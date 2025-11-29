import React from "react";
import {UserProfileImage} from "../../../Common/Components/ProfilePicture/UserProfileImage.tsx";
import { NotificationActionType } from "../../../Context/Notification/NotificationReducer.ts";
import NotificationBadge from "../../../Context/Notification/NotificationBadge.tsx";
import {useNotifications} from "../../../Context/Notification/NotificationContext.tsx";
import { useHomePageContext } from "../../../Context/HomePage/HomePageContext.tsx";
import { HomePageActionType } from "../../../Context/HomePage/HomePageReducer.ts";
import { PendingContact } from "../../../Models/PendingContact.ts";

interface PendingContactCardProps {
    contact: PendingContact;
}

const PendingContactCard: React.FC<PendingContactCardProps> = ({contact}) => {
    const name = contact.displayName ?? contact.username;
    const {selectedItem, homeDispatch} = useHomePageContext();
    const isSelected = selectedItem.type === 'pending' && selectedItem.value.id === contact.id;
    const {notificationDispatch} = useNotifications();

    const cardClasses = `flex items-center py-2 px-2 rounded-md cursor-pointer relative
    ${isSelected ? "bg-darkGray-300" : "hover:bg-darkGray-300"}`;

    const onHandleClick = () => {
        if (isSelected) {
            homeDispatch({type: HomePageActionType.ClearSelection, payload: null});
            return;
        }
        notificationDispatch({type: NotificationActionType.RemoveFriendRequest, payload: {userTag: contact.id}});
        homeDispatch({
            type: HomePageActionType.SetSelectedPendingContact,
            payload: contact
        });
    }

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            <NotificationBadge section="requests" itemId={contact.id}/>
            <div
                className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 relative">
                <UserProfileImage
                    username={contact.username}
                    displayName={contact.displayName}
                    profilePictureUrl={contact.profilePicture}
                />
            </div>
            <div className="ml-3">
                <div className="text-white font-semibold">{name}</div>
            </div>
        </div>
    );
};

export default PendingContactCard;
