import React, {createContext, useEffect} from "react";
import {ChangeEvent} from "../SignalR/ChangeEvent/ChangeEvent.ts";
import {ChangeEventType} from "../SignalR/ChangeEvent/ChangeEventType.ts";
import ChangeEventManager from "../SignalR/ChangeEvent/ChangeEventManager.ts";
import {ProfilePictureUpdatedEvent} from "../SignalR/ChangeEvent/EventData.ts";

interface User {
    id: string;
    username: string;
    userTag: string;
    deviceId: string;
    base64ProfilePicture: string | null;
    displayName: string | null;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User| null) => void;
    updateUser: (user: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = React.useState<User | null>(null);


    useEffect(() => {
        const handleProfilePicChanged = (evt: ChangeEvent) => {
            const data = evt.data as ProfilePictureUpdatedEvent;
            if (user && user.id === data.id) {
                setUser(prev =>
                    prev ? { ...prev, profilePicture: data.profilePictureUrl } : prev
                );
            }
        };
        const eventManager = ChangeEventManager.getInstance();
        eventManager.subscribe(ChangeEventType.ProfilePictureChanged, handleProfilePicChanged);
        return () => {
            eventManager.unsubscribe(ChangeEventType.ProfilePictureChanged, handleProfilePicChanged);
        };
    }, [user]);


    const updateUser = (updates: Partial<User>) => {
        setUser((prev) => {
            if (prev === null) { // If the user is null, we can't update it
                return null;
            }
            return { ...prev, ...updates }; // Otherwise we merge the updates into the user object
        });
    }

    return <UserContext.Provider value={{ user, setUser, updateUser }}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = React.useContext(UserContext);

    if (context === undefined) {
        throw new Error("useUser must be used within an UserProvider");
    }

    return context;
};