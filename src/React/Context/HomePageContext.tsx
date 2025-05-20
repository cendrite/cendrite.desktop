import React, { createContext, useState } from "react";
import { Contact } from "./ContactContext";
import { PendingContact } from "./PendingContactContext.tsx";

interface HomePageContextType {
    selectedContact: Contact | null;
    selectedPendingContact: PendingContact | null;
    setSelectedContact: (contact: Contact | null) => void;
    setSelectedPendingContact: (contact: PendingContact | null) => void;
    selectedChatId: string | null;
    setSelectedChatId: (chatId: string | null) => void;
}

export const HomePageContext = createContext<HomePageContextType | undefined>(undefined);

interface HomePageProviderProps {
    children: React.ReactNode;
}

export const HomePageProvider: React.FC<HomePageProviderProps> = ({ children }) => {
    const [selectedContact, _setSelectedContact] = useState<Contact | null>(null);
    const [selectedPendingContact, _setSelectedPendingContact] = useState<PendingContact | null>(null);
    const [selectedChatId, _setSelectedChatId] = useState<string | null>(null);

    const setSelectedContact = (contact: Contact | null) => {
        _setSelectedContact(contact);
        if (contact) _setSelectedPendingContact(null); // Unset pending contact
        if (contact) _setSelectedChatId(null); // Unset chat if a contact is selected
    };

    const setSelectedPendingContact = (pendingContact: PendingContact | null) => {
        _setSelectedPendingContact(pendingContact);
        if (pendingContact) _setSelectedContact(null); // Unset normal contact
        if (pendingContact) _setSelectedChatId(null); // Unset chat if a pending contact is selected
    };

    const setSelectedChatId = (chatId: string | null) => {
        _setSelectedChatId(chatId);
        if (chatId) _setSelectedContact(null); // Unset normal contact
        if (chatId) _setSelectedPendingContact(null); // Unset pending contact
    };

    return (
        <HomePageContext.Provider
            value={{
                selectedContact,
                setSelectedContact,
                selectedPendingContact,
                setSelectedPendingContact,
                selectedChatId,
                setSelectedChatId
            }}>
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
