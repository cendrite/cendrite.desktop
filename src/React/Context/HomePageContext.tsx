import React, {createContext, useState} from "react";
import { Contact } from "./ContactContext";
import {PendingContact} from "./PendingContactsContext.tsx";

interface HomaPageContextType {
    selectedContact: Contact | null;
    selectedPendingContact: PendingContact | null;
    setSelectedContact: (contact: Contact | null) => void;
    setSelectedPendingContact: (contact: PendingContact | null) => void;
    // selectedChat: Chat | null;
    // setSelectedChat: (chat: Chat | null) => void;
}


export const HomePageContext = createContext<HomaPageContextType | undefined>(undefined);

interface HomePageProviderProps {
    children: React.ReactNode;
}

export const HomePageProvider: React.FC<HomePageProviderProps> = ({children}) => {
    const [selectedContact, _setSelectedContact] = useState<Contact | null>(null);
    const [selectedPendingContact, _setSelectedPendingContact] = useState<PendingContact | null>(null);

    const setSelectedContact = (contact: Contact | null) => {
        _setSelectedContact(contact);
        if (contact) _setSelectedPendingContact(null); // Unset pending contact
    };

    const setSelectedPendingContact = (contact: PendingContact | null) => {
        _setSelectedPendingContact(contact);
        if (contact) _setSelectedContact(null); // Unset normal contact
    };


    return (
        <HomePageContext.Provider value={{selectedContact, setSelectedContact, selectedPendingContact, setSelectedPendingContact}}>
            {children}
        </HomePageContext.Provider>
    );
};

export const useHomePageContext = () => {
    const context = React.useContext(HomePageContext);
    if (!context) {
        throw new Error("useHomePageContext must be used within a HomePageProvider");
    }
    return context;
};
