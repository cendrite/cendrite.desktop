import React, {useContext} from "react";
import {UserProfileImage} from "../../../Common/Components/UserProfileImage.tsx";
import { Contact } from "../../../Context/ContactContext.tsx";
import {HomePageContext} from "../../../Context/HomePageContext.tsx";

interface ContactCardProps {
    contact: Contact;
}

const ContactCard: React.FC<ContactCardProps> = ({contact}) => {
    const { selectedContact, setSelectedContact } = useContext(HomePageContext)!;
    const isSelected = selectedContact && selectedContact.id === contact.id;

    const name = contact.displayName ?? contact.username;

    const onHandleClick = () => {
        if (isSelected) {
            setSelectedContact(null);
            return;
        }

        setSelectedContact(contact);
    }

    const cardClasses = `flex items-center py-2 px-2 rounded-md cursor-pointer 
    ${isSelected ? "bg-darkGray-300" : "hover:bg-darkGray-300"}`;

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                <UserProfileImage
                    base64ProfilePicture={contact.profilePicture ?? undefined}
                    displayName={contact.displayName ?? undefined}
                    username={contact.username}
                />
            </div>
            <span className="text-white ml-3">{name}</span>
        </div>
    );
};

export default ContactCard;
