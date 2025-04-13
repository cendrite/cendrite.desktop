import React, {createContext, useState} from "react";
import { Contact } from "./ContactContext";

interface HomaPageContextType {
    selectedContact: Contact | null;
    setSelectedContact: (contact: Contact | null) => void;
    // selectedChat: Chat | null;
    // setSelectedChat: (chat: Chat | null) => void;
}


export const HomePageContext = createContext<HomaPageContextType | undefined>(undefined);

interface HomePageProviderProps {
    children: React.ReactNode;
}

export const HomePageProvider: React.FC<HomePageProviderProps> = ({children}) => {
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    return (
        <HomePageContext.Provider value={{selectedContact, setSelectedContact}}>
            {children}
        </HomePageContext.Provider>
    );
};
