import React from "react";
import {NotificationAction} from "./NotificationReducer.tsx";
import {NotificationState} from "./NotificationState.ts";



export interface NotificationContextType {
    state: NotificationState;
    dispatch: React.Dispatch<NotificationAction>;
}

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);


export const useNotifications = () => {
    const context = React.useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};