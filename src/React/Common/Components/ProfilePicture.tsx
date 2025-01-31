import React from "react";
import {useUser} from "../Context/UserContext.tsx";

const ProfilePicture: React.FC = () => {
    const {user} = useUser();

    return (
        <img
            src={user?.profilePictureUrl}
            alt="Profile Picture"
            className="h-10 w-10 rounded-full"
        />
    );
};

export default ProfilePicture;