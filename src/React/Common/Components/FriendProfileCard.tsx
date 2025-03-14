import React from "react";
import { UserProfileImage } from "./UserProfileImage.tsx";
import { UserPlusIcon } from "@heroicons/react/24/outline";

interface PublicUserProfileCardProps {
    username: string;
    userTag: string;
    displayName?: string;
    profilePictureUrl?: string;
}

const PublicUserProfileCard: React.FC<PublicUserProfileCardProps> = ({ username, userTag, displayName, profilePictureUrl }) => {

    const onAddFriend = () => {
        // Add friend logic
    };

    return (
        <div className="flex items-center justify-between p-3 bg-darkGray-600 rounded-lg shadow-lg w-full">
            <div className="flex items-center">
                <UserProfileImage
                    username={username}
                    displayName={displayName}
                    profilePictureUrl={profilePictureUrl}
                />
                <div className="ml-3">
                    <div className="text-white font-semibold">{displayName || username}</div>
                    <div className="text-gray-400 text-sm">@{userTag}</div>
                </div>
            </div>

            {/* Add Friend Button */}
            <button
                onClick={onAddFriend}
                className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition"
            >
                <UserPlusIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default PublicUserProfileCard;
