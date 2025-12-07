import React, {createContext} from "react";
import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {HomePageAction} from "./HomePageReducer.ts";
import { Contact } from "../../Models/Contact.ts";
import { PendingContact } from "../../Models/PendingContact.ts";

export type SelectedItem =
    | { type: 'contact'; value: Contact }
    | { type: 'pending'; value: PendingContact }
    | { type: 'chat'; value: ChatViewModel }
    | { type: 'none' };


interface HomePageContextType {
    selectedItem: SelectedItem;
    homeDispatch: React.Dispatch<HomePageAction>;
}

export const HomePageContext = createContext<HomePageContextType | undefined>(undefined);

export const useHomePage = () => {
    const context = React.useContext(HomePageContext);
    if (!context) {
        throw new Error("useHomePageContext must be used within a HomePageProvider");
    }
    return context;
};
