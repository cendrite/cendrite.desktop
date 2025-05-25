import React, {createContext} from "react";
import {Contact} from "../ContactContext.tsx";
import {PendingContact} from "../PendingContactContext.tsx";
import {ChatViewModel} from "../../Models/ChatViewModel.ts";
import {HomePageContextAction} from "./HomePageReducer.ts";

export type SelectedItem =
    | { type: 'contact'; value: Contact }
    | { type: 'pending'; value: PendingContact }
    | { type: 'chat'; value: ChatViewModel }
    | { type: 'none' };


interface HomePageContextType {
    selectedItem: SelectedItem;
    homeDispatch: React.Dispatch<HomePageContextAction>;
}

export const HomePageContext = createContext<HomePageContextType | undefined>(undefined);

export const useHomePageContext = () => {
    const context = React.useContext(HomePageContext);
    if (!context) {
        throw new Error("useHomePageContext must be used within a HomePageProvider");
    }
    return context;
};