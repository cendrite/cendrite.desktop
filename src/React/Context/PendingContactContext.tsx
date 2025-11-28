import React, {useCallback, useEffect} from "react";
import {FriendService} from "../Common/Services/FriendService.ts";
import {ChangeEvent} from "../SignalR/ChangeEvent/ChangeEvent.ts";
import {ChangeEventType} from "../SignalR/ChangeEvent/ChangeEventType.ts";
import {FriendRequestAcceptedEvent, FriendRequestEvent} from "../SignalR/ChangeEvent/EventData.ts";
import {useSignalEvent} from "../SignalR/Utility/Utilities.ts";
import {useNotifications} from "./Notification/NotificationContext.tsx";
import {NotificationActionType} from "./Notification/NotificationReducer.ts";
import { useUser } from "./User/UserContext.tsx";

export class PendingContact {
    id: string;
    username: string;
    displayName: string | null;
    profilePicture: string | null;
    IsSeen: boolean = false;

    constructor(id: string, username: string, isSeen: boolean, displayName: string | null, profilePicture: string | null) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.profilePicture = profilePicture;
        this.IsSeen = isSeen;
    }
}

interface FriendRequestContextType {
    pendingContacts: PendingContact[];
    setPendingContacts: React.Dispatch<React.SetStateAction<PendingContact[]>>;
}

const PendingContactContext = React.createContext<FriendRequestContextType | undefined>(undefined);

export const PendingContactProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [pendingContacts, setPendingContacts] = React.useState<PendingContact[]>([]);
    const friendService = React.useMemo(() => new FriendService(), []);
    const {user} = useUser();
    const {notificationDispatch} = useNotifications();

    useEffect(() => {
        if (!user) {
            console.warn("User is not defined, cannot load pending contacts.");
            return;
        }
        async function load() {
            try {
                const loadedRequests = await friendService.GetFriendRequests();
                setPendingContacts(loadedRequests);
                loadedRequests.forEach(r =>
                    notificationDispatch({ type: NotificationActionType.AddFriendRequest, payload: { userTag: r.id } })
                );
            } catch (error) {
                console.error("Error loading pending contacts:", error);
            }
        }
        load().catch(err=> {console.log("Error loading pending contacts", err)});
    }, [user, notificationDispatch, friendService]);


    const handleFriendRequestReceived = useCallback(async (evt: ChangeEvent<FriendRequestEvent>) => {
        console.log("Friend request received", evt.data);
        setPendingContacts((prev) => [
            ...prev,
            new PendingContact(evt.data.tag, evt.data.username, false, evt.data.displayName, evt.data.presignedProfilePictureUrl),
        ]);
        notificationDispatch({ type: NotificationActionType.AddFriendRequest, payload: { userTag: evt.data.tag } });
    }, [notificationDispatch]);

    const handleFriendRequestRejected = useCallback(async (evt: ChangeEvent<FriendRequestEvent>) => {
        setPendingContacts((prev) => prev.filter((contact) => contact.id !== evt.data.tag));
        notificationDispatch({ type: NotificationActionType.RemoveFriendRequest, payload: { userTag: evt.data.tag } });
    }, [notificationDispatch]);

    const handleFriendRequestAcceptedEvent = useCallback(async (evt: ChangeEvent<FriendRequestAcceptedEvent>) => {
        setPendingContacts((prev) => prev.filter((contact) => contact.id !== evt.data.tag));
        notificationDispatch({ type: NotificationActionType.RemoveFriendRequest, payload: { userTag: evt.data.tag } });
    }, [notificationDispatch]);

    useSignalEvent<FriendRequestEvent>(ChangeEventType.FriendRequest, handleFriendRequestReceived);
    useSignalEvent<FriendRequestEvent>(ChangeEventType.FriendRequestRejected, handleFriendRequestRejected);
    useSignalEvent<FriendRequestAcceptedEvent>(ChangeEventType.FriendRequestAccepted, handleFriendRequestAcceptedEvent);

    return (
        <PendingContactContext.Provider value={{pendingContacts, setPendingContacts}}>
            {children}
        </PendingContactContext.Provider>
    );
};

export const usePendingContacts = () => {
    const context = React.useContext(PendingContactContext);
    if (!context) {
        throw new Error("useContacts must be used within a ContactProvider");
    }
    return context;
};
