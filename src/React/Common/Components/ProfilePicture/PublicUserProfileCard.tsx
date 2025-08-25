import React, {useState} from "react";
import {UserProfileImage} from "./UserProfileImage.tsx";
import {CheckIcon, XMarkIcon, PlusIcon} from "@heroicons/react/24/outline";
import {useUser } from "../../../Context/UserContext.tsx";
import { FriendService } from "../../Services/FriendService.ts";
import { FriendshipStatus } from "../../../Enums/FriendshipStatus.ts";
import { FriendshipDirection } from "../../../Enums/FriendshipDirection.ts";
import { useContacts } from "../../../Context/ContactContext.tsx";
import {delay} from "../../../../Shared/HelperFunctions.ts";
import ToolTip from "../Utility/ToolTip.tsx";

interface PublicUserProfileCardProps {
    username: string;
    friendTag: string;
    displayName: string | null;
    profilePictureUrl: string | null;
    friendshipStatus?: FriendshipStatus;
    friendshipDirection: FriendshipDirection;
}

const PublicUserProfileCard: React.FC<PublicUserProfileCardProps> = ({
                                                                         username,
                                                                         friendTag,
                                                                         displayName,
                                                                         profilePictureUrl,
                                                                         friendshipStatus,
                                                                         friendshipDirection,
                                                                     }) => {
    const userContext = useUser();
    const friendService = new FriendService();
    const [friendAdded, setFriendAdded] = useState<boolean>(false);
    const [currentFriendshipStatus, setCurrentFriendshipStatus] = useState<FriendshipStatus | undefined>(friendshipStatus);
    const [currentFriendshipDirection, setCurrentFriendshipDirection] = useState<FriendshipDirection>(friendshipDirection);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const {setContacts} = useContacts();


    const onAddFriend = async () => {
        if (friendAdded) return;

        const result = await friendService.AddFriend(friendTag);
        if (result.success) {
            setFriendAdded(true);
            setIsLoading(true);
        }

        await delay(750);
        setIsLoading(false);
    };

    const onAcceptFriendRequest = async () => {
        const result = await friendService.AcceptFriendship(friendTag);
        if (result.success) {
            setCurrentFriendshipStatus(FriendshipStatus.Accepted);
            setCurrentFriendshipDirection(FriendshipDirection.None);
            setIsLoading(true);
            setContacts((prevContacts) => [...prevContacts, result.data!]);
        }

        await delay(750);
        setIsLoading(false);
    };

    const onDeclineFriendRequest = async () => {
        console.log(friendTag);
        const result = await friendService.DeclineFriendRequest(friendTag);
        if (result.success) {
            setFriendAdded(false);
            setCurrentFriendshipStatus(undefined);
            setCurrentFriendshipDirection(FriendshipDirection.None);
            setIsLoading(true);
        }

        await delay(750);
        setIsLoading(false);
    };

    const renderFriendButton = () => {
        if (isLoading) {
            return (
                <ToolTip content="Processing...">
                    <button className="p-1 flex items-center justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-t-transparent border-white rounded-full"/>
                    </button>
                </ToolTip>
            );
        }
        if (userContext.user?.userTag === friendTag) return null;

        if ((currentFriendshipStatus === FriendshipStatus.Accepted)) {
            return (
                <ToolTip content={"already friends"}>
                    <button className="p-2 bg-green-500 rounded-full cursor-default">
                        <CheckIcon className="h-6 w-6 text-white"/>
                    </button>
                </ToolTip>
            );
        }

        if (currentFriendshipStatus === FriendshipStatus.Pending && currentFriendshipDirection === FriendshipDirection.Received) {
            return (
                <>
                    <ToolTip content="Decline friend request">
                        <button
                            onClick={onDeclineFriendRequest}
                            className="p-2 bg-darkGray-300 hover:bg-darkGray-100 rounded-full cursor-pointer transition-colors"
                        >
                            <XMarkIcon className="h-4 w-4 text-white"/>
                        </button>
                    </ToolTip>
                    <ToolTip content="Accept friend request">
                        <button
                            onClick={onAcceptFriendRequest}
                            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full cursor-pointer transition-colors"
                        >
                            <CheckIcon className="h-4 w-4 text-white"/>
                        </button>
                    </ToolTip>
                </>
            );
        }

        if ((currentFriendshipStatus === FriendshipStatus.Pending && currentFriendshipDirection === FriendshipDirection.Sent) || friendAdded) {
            return (
                <ToolTip content="Cancel friend request">
                    <button onClick={onDeclineFriendRequest}
                            className="p-2 bg-darkGray-300 hover:bg-darkGray-100 rounded-full cursor-pointer transition-colors">
                        <XMarkIcon className="h-4 w-4 text-white"/>
                    </button>
                </ToolTip>);
        }
        return (
            <ToolTip content="Send friend request">
                <button
                    onClick={onAddFriend}
                    className="p-2 bg-darkGray-300 hover:bg-darkGray-100 rounded-full cursor-pointer transition-colors"
                >
                    <PlusIcon className="h-4 w-4 text-white"/>
                </button>
            </ToolTip>
        );
    };

    return (
        <div className="flex items-center justify-between p-3 bg-darkGray-600 rounded-lg shadow-lg w-full">
            <div className="flex items-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                    <UserProfileImage
                        username={username}
                        displayName={displayName}
                        profilePictureUrl={profilePictureUrl}
                        base64ProfilePicture={null}
                    />
                </div>
                <div className="ml-3">
                    <div className="text-white font-semibold">{displayName || username}</div>
                    <div className="text-gray-400 text-sm">@{friendTag}</div>
                </div>
            </div>

            {renderFriendButton()}
        </div>
    );
};

export default PublicUserProfileCard;
