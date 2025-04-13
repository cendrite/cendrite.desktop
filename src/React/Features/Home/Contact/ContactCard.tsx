import React from "react";
import { Contact } from "./ContactContext.tsx";
import {UserProfileImage} from "../../../Common/Components/UserProfileImage.tsx";

interface ContactCardProps {
    contact: Contact;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact }) => {
    const name = contact.displayName ?? contact.username;

    return (
        <div className="flex items-center py-3 px-3 hover:bg-zinc-700 rounded-md">
            <UserProfileImage
                base64ProfilePicture={contact.profilePicture ?? undefined}
                displayName={contact.displayName ?? undefined}
                username={contact.username}
            />
            <span className="text-white ml-3">{name}</span>
        </div>
    );
};

export default ContactCard;
