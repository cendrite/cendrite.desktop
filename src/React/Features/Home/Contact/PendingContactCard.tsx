import {PendingContact} from "../../../Context/PendingContactsContext.tsx";
import React from "react";
import {UserProfileImage} from "../../../Common/Components/UserProfileImage.tsx";
import ToolTip from "../../../Common/Components/ToolTip.tsx";
import {CheckIcon, XMarkIcon} from "@heroicons/react/24/outline";

interface PendingContactCardProps {
    contact: PendingContact;
    onAccept: (contact: PendingContact) => void;
    onDecline: (contact: PendingContact) => void;
    onBlock: (contact: PendingContact) => void;
}

const PendingContactCard: React.FC<PendingContactCardProps> = ({contact, onAccept, onDecline, onBlock}) => {
    const name = contact.displayName ?? contact.username;

    return (
        <div className="flex items-center">
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                <UserProfileImage
                    username={contact.username}
                    displayName={contact.displayName}
                    base64ProfilePicture={contact.profilePicture}
                    profilePictureUrl={null}
                />
            </div>
            <div className="ml-3">
                <div className="text-white font-semibold">{name}</div>
                <div className="text-gray-400 text-sm">@{contact.id}</div>
            </div>

            <ToolTip content="Decline friend request">
                <button
                    onClick={() => onDecline}
                    className="p-2 bg-darkGray-300 hover:bg-darkGray-100 rounded-full cursor-pointer transition-colors"
                >
                    <XMarkIcon className="h-4 w-4 text-white"/>
                </button>
            </ToolTip>
            <ToolTip content="Accept friend request">
                <button
                    onClick={() => onAccept}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full cursor-pointer transition-colors"
                >
                    <CheckIcon className="h-4 w-4 text-white"/>
                </button>
            </ToolTip>

            <ToolTip content="Block user">
                <button
                    onClick={() => onBlock}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full cursor-pointer transition-colors"
                >
                    <XMarkIcon className="h-4 w-4 text-white"/>
                </button>
            </ToolTip>
        </div>
    );
};

export default PendingContactCard;