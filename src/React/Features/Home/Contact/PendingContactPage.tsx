import {PendingContact, usePendingContacts} from "../../../Context/PendingContactContext.tsx";
import React, {useEffect, useMemo, useState} from "react";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import {UserProfileImage} from "../../../Common/Components/UserProfileImage.tsx";
import {CheckIcon, ExclamationTriangleIcon, NoSymbolIcon, XMarkIcon} from "@heroicons/react/24/outline";
import ToolTip from "../../../Common/Components/ToolTip.tsx";
import {FriendService} from "../../../Common/Services/FriendService.ts";
import {delay} from "../../../../Shared/HelperFunctions.ts";
import {useUser} from "../../../Context/UserContext.tsx";

interface PendingContactPage {
    pendingContact: PendingContact;
    onClose: () => void;
}

type LoadingAction = 'accept' | 'decline' | 'block' | null;

const PendingContactPage: React.FC<PendingContactPage> = ({pendingContact, onClose}) => {
    const [slideClass, setSlideClass] = useState("translate-x-full");
    const friendService = useMemo(() => new FriendService(), []);
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
    const {setPendingContacts} = usePendingContacts();
    const {user} = useUser();

    useEffect(() => {
        setSlideClass("translate-x-0");
    }, []);

    const handleSlideOut = () => {
        setSlideClass("translate-x-full");
        setTimeout(() => onClose(), 300);
    };

    const handleAccept = async () => {
        const result = await friendService.AcceptFriendship(user!.id, pendingContact.id);
        if(result.success)
        {
            setPendingContacts(prev => prev.filter(c => c.id !== pendingContact.id));
            setLoadingAction("accept");
        }
        await delay(750);
        setLoadingAction(null);
        onClose();
    };

    const handleDecline = async () => {
        const result = await friendService.DeclineFriendRequest(user!.id, pendingContact.id);
        if(result.success)
        {
            setPendingContacts(prev => prev.filter(c => c.id !== pendingContact.id));
            setLoadingAction("decline");
        }
        await delay(750);
        setLoadingAction(null);
        onClose();
    };

    const handleBlock = async () => {
        // Handle block user logic
    };

    return (
        <>
            <div className={`absolute inset-0  text-white shadow-lg transition-transform duration-300 ${slideClass}`}>
                <div className="flex flex-col h-full">
                    {/* Top Bar */}
                    <div className="flex items-center p-3 shrink-0">
                        <button
                            className="text-gray-400 hover:text-gray-300"
                            onClick={handleSlideOut}>
                            <ChevronLeftIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center mt-4">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 mb-3">
                                <UserProfileImage
                                    base64ProfilePicture={null}
                                    displayName={pendingContact.displayName}
                                    username={pendingContact.username}
                                    profilePictureUrl={pendingContact.profilePicture}
                                />
                            </div>
                            <h2 className="text-lg font-semibold">
                                {pendingContact.displayName || pendingContact.username}
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">{pendingContact.id}</p>
                        </div>

                        {/* Divider */}
                        <div className="mt-6 mx-auto w-3/4 border-t border-zinc-700" />
                        <div className="mt-4 flex items-center justify-center px-4 text-gray-200">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-400" />
                            <p className="text-sm text-center">
                                Be careful accepting requests from people you do not know.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center items-center space-x-4 mt-4">
                            <ToolTip content="Accept friend request">
                                <button
                                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full cursor-pointer transition duration-150 ease-in-out transform hover:scale-105"
                                    onClick={() => handleAccept()}
                                >
                                    {loadingAction === "accept" ? <div className="animate-spin h-6 w-6 border-2 border-t-transparent border-white rounded-full"/> : <CheckIcon className="h-4 w-4 text-white"/> }
                                </button>
                            </ToolTip>
                            <ToolTip content="Decline friend request">
                                <button
                                    className="p-2 bg-darkGray-500 hover:accent-darkGray-600 rounded-full cursor-pointer transition duration-150 ease-in-out transform hover:scale-105"
                                    onClick={() => handleDecline()}
                                >
                                    {loadingAction === "decline" ? <div className="animate-spin h-6 w-6 border-2 border-t-transparent border-white rounded-full"/> : <XMarkIcon className="h-4 w-4 text-white"/>}
                                </button>
                            </ToolTip>
                            <ToolTip content="Block user">
                                <button
                                    className="p-2 bg-red-600 hover:bg-red-700 rounded-full cursor-pointer transition duration-150 ease-in-out transform hover:scale-105"
                                    onClick={() => handleBlock()}
                                >
                                    {loadingAction === "block" ? <div className="animate-spin h-6 w-6 border-2 border-t-transparent border-white rounded-full"/> : <NoSymbolIcon className="h-4 w-4 text-white"/>}
                                </button>
                            </ToolTip>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PendingContactPage;