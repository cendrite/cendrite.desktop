import React from "react";
import clsx from "clsx";
import { useUser } from "../../../Context/User/UserContext";

interface AvatarProps {
    className?: string;
    AvatarKey?: string;
}

const Avatar: React.FC<AvatarProps> = ({className, AvatarKey}) => {
    const {user} = useUser();
    console.warn(AvatarKey);

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

export default Avatar;
