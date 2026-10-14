import React from "react";
import { Contact } from "@/React/Models/Contact";
import { ContactAction } from "./ContactReducer";
import { getByConnectionId, getById } from "./ContactSelectors";

export interface ContactContextType {
    contacts: Contact[];
    contactDispatch: React.Dispatch<ContactAction>;
}

export const ContactContext = React.createContext<ContactContextType| undefined>(undefined);

export const useContacts = () => {
    const context = React.useContext(ContactContext);

    if (context === undefined) {
        throw new Error('useContacts must be used within a ContactProvider');
    }

    const {contacts, contactDispatch} = context;

    return {
        contacts: contacts,
        contactDispatch: contactDispatch,
        getContactById: (id: string) => getById(contacts, id),
        getContactByConnectionId: (connectionId: string) => getByConnectionId(contacts, connectionId),
    }
}
