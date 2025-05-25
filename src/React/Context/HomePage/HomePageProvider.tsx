import React, { useReducer } from "react";
import { HomePageContext } from "./HomePageContext.tsx";
import { homePageReducer } from "./HomePageReducer.ts";
import { SelectedItem } from "./HomePageContext.tsx";

export const HomePageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initialState: SelectedItem = { type: 'none' };
    const [selectedItem, homeDispatch] = useReducer(homePageReducer, initialState);

    return (
        <HomePageContext.Provider value={{ selectedItem, homeDispatch }}>
            {children}
        </HomePageContext.Provider>
    );
};
