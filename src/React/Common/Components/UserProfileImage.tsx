import {API_URLS} from "../Api/ApiUrls.ts";
import React from "react";

export interface UserProfileImageProps {
    base64ProfilePicture?: string;
    profilePictureUrl?: string;
    displayName?: string;
    username: string;
}

export const UserProfileImage: React.FC<UserProfileImageProps> = ({ profilePictureUrl, displayName, username, base64ProfilePicture }) => {

    // Extract initials from displayName (if available) or fallback to username
    const avatarText = (displayName ?? username)
        .slice(0, 2)
        .toUpperCase();

    // Use base64 image if available, otherwise use the profilePictureUrl and fetch from the bucket.
    const imageSource = base64ProfilePicture ? base64ProfilePicture : `${API_URLS.BUCKET.BUCKET_BASE}${profilePictureUrl}`;

    return (
        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
            {profilePictureUrl ? (
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
