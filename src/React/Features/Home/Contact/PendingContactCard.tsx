import {PendingContact} from "../../../Context/PendingContactContext.tsx";
import React from "react";
import {UserProfileImage} from "../../../Common/Components/UserProfileImage.tsx";
import NotificationBadge from "../../../Common/Components/NotificationBadge.tsx";
import {useHomePageContext} from "../../../Context/HomePageContext.tsx";
import {ActionType, useNotifications} from "../../../Context/NotificationContext.tsx";

interface PendingContactCardProps {
    contact: PendingContact;
}

const PendingContactCard: React.FC<PendingContactCardProps> = ({contact}) => {
    const name = contact.displayName ?? contact.username;
    const {selectedPendingContact, setSelectedPendingContact} = useHomePageContext();
    const isSelected = selectedPendingContact && selectedPendingContact.id === contact.chatId;
    const {dispatch} = useNotifications();
    console.log("PendingContactCard", contact, selectedPendingContact);

    const cardClasses = `flex items-center py-2 px-2 rounded-md cursor-pointer relative
    ${isSelected ? "bg-darkGray-300" : "hover:bg-darkGray-300"}`;

    const onHandleClick = () => {
        if (isSelected) {
            setSelectedPendingContact(null);
            return;
        }
        dispatch({type: ActionType.RemoveFriendRequest, payload: {userTag: contact.chatId}});
        setSelectedPendingContact(contact);
    }

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            <NotificationBadge section="requests" itemId={contact.chatId}/>
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