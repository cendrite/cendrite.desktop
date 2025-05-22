import React, { createContext, useState } from "react";
import { Contact } from "./ContactContext";
import { PendingContact } from "./PendingContactContext.tsx";
import {ChatViewModel} from "../Models/ChatViewModel.ts";

interface HomePageContextType {
    selectedContact: Contact | null;
    selectedPendingContact: PendingContact | null;
    setSelectedContact: (contact: Contact | null) => void;
    setSelectedPendingContact: (contact: PendingContact | null) => void;
    selectedChat: ChatViewModel | null;
    setSelectedChat: (chat: ChatViewModel | null) => void;
}

export const HomePageContext = createContext<HomePageContextType | undefined>(undefined);

interface HomePageProviderProps {
    children: React.ReactNode;
}

export const HomePageProvider: React.FC<HomePageProviderProps> = ({ children }) => {
    const [selectedContact, _setSelectedContact] = useState<Contact | null>(null);
    const [selectedPendingContact, _setSelectedPendingContact] = useState<PendingContact | null>(null);
    const [selectedChat, _setSelectedChat] = useState<ChatViewModel | null>(null);

    const setSelectedContact = (contact: Contact | null) => {
        _setSelectedContact(contact);
        if (contact) _setSelectedPendingContact(null); // Unset pending contact
        if (contact) _setSelectedChat(null); // Unset chat if a contact is selected
    };

    const setSelectedPendingContact = (pendingContact: PendingContact | null) => {
        _setSelectedPendingContact(pendingContact);
        if (pendingContact) _setSelectedContact(null); // Unset normal contact
        if (pendingContact) _setSelectedChat(null); // Unset chat if a pending contact is selected
    };

    const setSelectedChat = (chat: ChatViewModel | null) => {
        _setSelectedChat(chat);
        if (chat) _setSelectedContact(null); // Unset normal contact
        if (chat) _setSelectedPendingContact(null); // Unset pending contact
    };

    return (
        <HomePageContext.Provider
            value={{
                selectedContact,
                setSelectedContact,
                selectedPendingContact,
                setSelectedPendingContact,
                selectedChat,
                setSelectedChat
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
