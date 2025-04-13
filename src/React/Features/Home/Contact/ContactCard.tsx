import React, {useContext} from "react";
import {UserProfileImage} from "../../../Common/Components/UserProfileImage.tsx";
import { Contact } from "../../../Context/ContactContext.tsx";
import {HomePageContext} from "../../../Context/HomePageContext.tsx";

interface ContactCardProps {
    contact: Contact;
}

const ContactCard: React.FC<ContactCardProps> = ({contact}) => {
    const context = useContext(HomePageContext);
    if (!context) {
        throw new Error("ContactCard must be used within a HomePageProvider");
    }
    const name = contact.displayName ?? contact.username;
    const {setSelectedContact} = context;

    const onHandleClick = () => {
        setSelectedContact(contact);
    }

    return (
        <div className="flex items-center py-2 px-2 hover:bg-zinc-700 rounded-md" onClick={onHandleClick}>
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
