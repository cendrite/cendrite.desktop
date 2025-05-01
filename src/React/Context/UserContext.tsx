import React, {createContext, useEffect} from "react";
import {ChangeEvent} from "../SignalR/ChangeEvent/ChangeEvent.ts";
import {ChangeEventType} from "../SignalR/ChangeEvent/ChangeEventType.ts";
import {ProfilePictureUpdatedEvent} from "../SignalR/ChangeEvent/EventData.ts";
import {SignalManager} from "../SignalR/SignalManager.ts";
import {ChangeEventReceiver} from "../SignalR/ChangeEvent/ChangeEventReceiver.ts";
import {GetUserProfilePictureApi} from "../Common/Api/UserProfile/GetUserProfilePicture.ts";

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
    const eventReceiver = SignalManager.getInstance().getReceiver<ChangeEventReceiver>("ChangeEvents");
    const pictureApi = React.useMemo(() => new GetUserProfilePictureApi(), []);

    useEffect(() => {
        const handleProfilePicChanged = async (evt: ChangeEvent) => {
            const data = evt.data as ProfilePictureUpdatedEvent;

            console.log("Profile picture changed event received in userContext", data);
            if (user?.userTag !== data.userTag) {
                console.log("User ID does not match, ignoring event");
                return;
            }

            try {
                const result = await pictureApi.getUserProfilePicture({
                    profilePictureUrl: data.profilePictureUrl,
                });

                if (result.success && result.data) {
                    setUser(prev => prev && {
                        ...prev,
                        base64ProfilePicture: result.data!.base64ProfilePicture
                    });
                }
            } catch (err) {
                console.error("Failed to fetch updated profile pic", err);
            }
        };

        eventReceiver.subscribe(
            ChangeEventType.ProfilePictureChanged,
            handleProfilePicChanged,
        );
        return () => {
            eventReceiver.unsubscribe(
                ChangeEventType.ProfilePictureChanged,
                handleProfilePicChanged,
            );
        };
    }, [user, eventReceiver, pictureApi]);



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