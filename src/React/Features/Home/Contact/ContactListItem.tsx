import React from 'react';
import { useHomePage } from '@/React/Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '@/React/Context/HomePage/HomePageReducer.ts';
import { Contact } from '@/React/Models/Contact.ts';
import ContactCard from '@/React/Common/Components/Cards/ContactCard.tsx';

interface ContactListItemProps {
    contact: Contact;
}

const ContactListItem: React.FC<ContactListItemProps> = ({ contact }) => {
    const { selectedItem, homeDispatch } = useHomePage();
    const isSelected = selectedItem.type === 'contact' && selectedItem.value.id === contact.id;

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

    return <ContactCard contact={contact} selected={isSelected} onClick={onHandleClick} />;
};

export default ContactListItem;
