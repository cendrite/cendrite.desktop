import React from "react";
import { Contact } from "../../../Context/ContactContext.tsx";
import {UserProfileImage} from "../../../Common/Components/ProfilePicture/UserProfileImage.tsx";
import {useHomePageContext} from "../../../Context/HomePage/HomePageContext.tsx";
import {HomePageContextActionType} from "../../../Context/HomePage/HomePageReducer.ts";

interface ContactCardProps {
    contact: Contact;
}

const ContactCard: React.FC<ContactCardProps> = ({contact}) => {
    const { selectedItem, homeDispatch } = useHomePageContext();
    const isSelected = selectedItem.type === 'contact' && selectedItem.value.id === contact.id;
    const name = contact.displayName ?? contact.username;

    const onHandleClick = () => {
        if (isSelected) {
            homeDispatch({type: HomePageContextActionType.ClearSelection, payload: null});
            return;
        }
        homeDispatch({
            type: HomePageContextActionType.SetSelectedContact,
            payload: contact
        });
    }

    const cardClasses = `flex items-center py-2 px-2 rounded-md cursor-pointer 
    ${isSelected ? "bg-darkGray-300" : "hover:bg-darkGray-300"}`;

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                <UserProfileImage
                    base64ProfilePicture={contact.profilePicture}
                    displayName={contact.displayName}
                    username={contact.username}
                />
            </div>
            <span className="text-white ml-3">{name}</span>
        </div>
    );
};

export default ContactCard;
