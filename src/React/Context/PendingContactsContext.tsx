import React, {useEffect} from "react";
import {FriendService} from "../Common/Services/FriendService.ts";
import {useUser} from "./UserContext.tsx";
import {ChangeEventReceiver} from "../SignalR/ChangeEvent/ChangeEventReceiver.ts";
import { SignalManager } from "../SignalR/SignalManager.ts";
import {ChangeEvent} from "../SignalR/ChangeEvent/ChangeEvent.ts";
import {ChangeEventType} from "../SignalR/ChangeEvent/ChangeEventType.ts";
import {FriendRequestEvent} from "../SignalR/ChangeEvent/EventData.ts";
import {ActionType, useNotifications} from "./NotificationContext.tsx";

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

const PendingContactsContext = React.createContext<FriendRequestContextType | undefined>(undefined);

export const PendingContactProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [pendingContacts, setPendingContacts] = React.useState<PendingContact[]>([]);
    const eventReceiver = SignalManager.getInstance().getReceiver<ChangeEventReceiver>("ChangeEvents");
    const friendService = React.useMemo(() => new FriendService(), []);
    const {user} = useUser();
    const {dispatch} = useNotifications();

    const loadPendingContacts = async () => {
        if (!user) {
            console.warn("User is not defined, cannot load pending contacts.");
            return;
        }

        try {
            const loadedRequests = await friendService.GetFriendRequests(user.id);
            setPendingContacts(loadedRequests);
            for( const request of loadedRequests) {
                dispatch({type: ActionType.AddFriendRequest, payload: {userTag: request.id}});
            }

        } catch (error) {
            console.error("Error loading pending contacts:", error);
        }
    }

    useEffect(() => {
        const handleFriendRequestReceived = async (evt: ChangeEvent) => {
            const data = evt.data as FriendRequestEvent;
            console.log("Friend request event received in pending contacts context", data);
            setPendingContacts((prev) => [
                ...prev,
                new PendingContact(
                    data.tag,
                    data.username,
                    false,
                    data.displayName,
                    data.profilePictureUrl
                ),
            ]);
            dispatch({type: ActionType.AddFriendRequest, payload: {userTag: data.tag}});
        }
        eventReceiver.subscribe(
            ChangeEventType.FriendRequest,
            handleFriendRequestReceived,
        );

        return () => {
            eventReceiver.unsubscribe(
                ChangeEventType.FriendRequest,
                handleFriendRequestReceived,
            );
        };
    }, []);

    useEffect(() => {
        loadPendingContacts();
    }, [user]);

    return (
        <PendingContactsContext.Provider value={{pendingContacts, setPendingContacts}}>
            {children}
        </PendingContactsContext.Provider>
    );
};

export const usePendingContacts = () => {
    const context = React.useContext(PendingContactsContext);
    if (!context) {
        throw new Error("useContacts must be used within a ContactProvider");
    }
    return context;
};