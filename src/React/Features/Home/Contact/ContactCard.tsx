import React from 'react';
import { useHomePage } from '../../../Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '../../../Context/HomePage/HomePageReducer.ts';
import { Contact } from '../../../Models/Contact.ts';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';

interface ContactCardProps {
    contact: Contact;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact }) => {
    const { selectedItem, homeDispatch } = useHomePage();
    const isSelected = selectedItem.type === 'contact' && selectedItem.value.id === contact.id;
    const name = contact.displayName ?? contact.username;

    const onHandleClick = () => {
        if (isSelected) {
            homeDispatch({ type: HomePageActionType.Clear });
            return;
        }
        homeDispatch({
            type: HomePageActionType.SetSelectedContact,
            payload: contact,
        });
    };

    const cardClasses = `flex items-center py-2 px-2 rounded-md cursor-pointer 
    ${isSelected ? 'bg-darkGray-300' : 'hover:bg-darkGray-300'}`;

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                <Avatar className="w-11 h-11" AvatarKey={contact.avatarKey} Username={contact.username} />
            </div>
            <span className="text-white ml-3">{name}</span>
        </div>
    );
};

export default ContactCard;
