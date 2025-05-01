import {API_URLS} from "../Api/ApiUrls.ts";
import React from "react";

export interface UserProfileImageProps {
    base64ProfilePicture: string | null;
    profilePictureUrl?: string | null;
    displayName: string | null;
    username: string;
}

export const UserProfileImage: React.FC<UserProfileImageProps> = ({ profilePictureUrl, displayName, username, base64ProfilePicture }) => {

    const avatarText = (displayName ?? username)
        .slice(0, 2)
        .toUpperCase();

    function getImageSource() {
        if (base64ProfilePicture) {
            return base64ProfilePicture;
        } else if (profilePictureUrl) {
            return `${API_URLS.BUCKET.BUCKET_BASE}${profilePictureUrl}`;
        }
        return null;
    }

    const imageSource = getImageSource();

    return (
        <div>
            {imageSource ? (
                <img
                    className="w-full h-full object-cover"
                    src={imageSource}
                    alt={displayName ?? username}
                />
            ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                    {avatarText}
                </div>
            )}
        </div>
    );
};
