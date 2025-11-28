import React from "react";
import clsx from "clsx";
import { useUser } from "../../../Context/User/UserContext";

interface ProfilePictureProps {
    className?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({className}) => {
    const {user} = useUser();

    return user!.base64ProfilePicture ? (
        <img
            src={user?.base64ProfilePicture}
            alt="Profile Picture"
            className={clsx("rounded-full", className)}
        />
    ) : (
        <div
            className= {clsx("rounded-full bg-blue-200 flex items-center justify-center text-2xl font-extralight text-blue-900", className)}>
            {user?.username[0].concat(user?.username[1]).toUpperCase() || "?"}
        </div>
    );
};

export default ProfilePicture;
