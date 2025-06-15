import React from "react";
import { reducer } from "./NotificationReducer.ts";
import {NotificationState} from "./NotificationState.ts";
import { NotificationContext } from "./NotificationContext.tsx";

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, notificationDispatch] = React.useReducer(reducer, new NotificationState());

    return (
        <NotificationContext.Provider value={{ state, notificationDispatch }}>
            {children}
        </NotificationContext.Provider>
    );
};