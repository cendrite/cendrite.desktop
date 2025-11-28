import React from "react";
import { Contact } from "../../Models/Contact";
import { ContactContextAction } from "./ContactReducer";
import { getByConnectionId, getById } from "./ContactSelectors";

export interface ContactContextType {
    contacts: Contact[];
    contactDispatch: React.Dispatch<ContactContextAction>;
}
export const ContactContext = React.createContext<ContactContextType| undefined>(undefined);

export const useContacts = () => {
    const context = React.useContext(ContactContext);

    if (context === undefined) {
        throw new Error('useContacts must be used within a ContactProvider');
    }

    return {
        contacts: context.contacts,
        contactDispatch: context.contactDispatch,
        getById: (id: string) => getById(context.contacts, id),
        getByConnectionId: (connectionId: string) => getByConnectionId(context.contacts, connectionId),
    }
}
