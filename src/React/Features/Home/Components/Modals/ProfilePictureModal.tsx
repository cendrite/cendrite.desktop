import React, {useState} from "react";
import Modal from "react-modal";
import {useUser} from "../../../../Common/Context/UserContext.tsx";
import {PhotoIcon, PencilIcon} from "@heroicons/react/24/outline";
import avatar1 from "../../../../Assets/StockProfilePictures/avatar1.png";
import avatar2 from "../../../../Assets/StockProfilePictures/avatar2.png";
import avatar3 from "../../../../Assets/StockProfilePictures/avatar3.png";
import avatar4 from "../../../../Assets/StockProfilePictures/avatar4.png";
import avatar5 from "../../../../Assets/StockProfilePictures/avatar5.png";
import avatar6 from "../../../../Assets/StockProfilePictures/avatar6.png";
import avatar7 from "../../../../Assets/StockProfilePictures/avatar7.png";
import avatar8 from "../../../../Assets/StockProfilePictures/avatar8.png";
import avatar9 from "../../../../Assets/StockProfilePictures/avatar9.png";

interface ProfilePictureModalProps {
    isOpen: boolean;
    onClose: (shouldReopenParent: boolean) => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({isOpen, onClose}) => {
    const {user} = useUser();
    const [selectedProfilePicture, setSelectedProfilePicture] = useState<string | null>(null);

    const predefinedProfilePictures = [
        avatar1,
        avatar2,
        avatar3,
        avatar4,
        avatar5,
        avatar6,
        avatar7,
        avatar8,
        avatar9
    ];

    const updateProfilePicture = () => {

    }

    return (
        <Modal isOpen={isOpen}
               onRequestClose={() => onClose(false)}
               className="p-4 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[550px] max-auto relative"
               overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center"
               contentLabel="User Details">
            <div className="relative h-full flex flex-col">
                <button
                    onClick={() => onClose(true)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-gray-300">
                    ✕
                </button>

                <h3
                    className="absolute top-1 left-1 text-m text-gray-50">
                    Avatar
                </h3>

                <div className="flex flex-col items-center mt-8 mb-4">
                    {/* Show Selected Profile Picture */}
                    {selectedProfilePicture ? (
                        <img
                            src={selectedProfilePicture}
                            alt="Selected profile"
                            className="w-20 h-20 rounded-full"
                        />
                    ) : user?.profilePictureUrl ? (
                        <img
                            src={user.profilePictureUrl}
                            alt={`${user.username}'s profile`}
                            className="w-20 h-20 rounded-full"
                        />
                    ) : (
                        <div
                            className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-2xl font-extralight text-blue-900">
                            {user?.username[0].concat(user?.username[1]).toUpperCase() || "?"}
                        </div>
                    )}
                </div>

                <div className="flex justify-center items-center space-x-4 mb-8">
                    {/* Upload Image Option */}
                    <button
                        className="flex flex-col items-center justify-center bg-darkGray-200 hover:bg-darkGray-300 px-1.5 py-1 rounded-lg">
                        <PhotoIcon className="w-4 h-4 text-gray-200"/>
                        <h3 className="font-extralight text-[0.6rem]">image</h3>
                    </button>

                    {/* Text (Initials) Option */}
                    <button
                        className="flex flex-col items-center justify-center bg-darkGray-200 hover:bg-darkGray-300 px-2.5 py-1 rounded-lg">
                        <PencilIcon className="w-4 h-4 text-gray-200"/>
                        <h3 className="font-extralight text-[0.6rem]">text</h3>
                    </button>
                </div>

                <div className="grid grid-cols-3 justify-center items-center gap-6 mx-auto">
                    {predefinedProfilePictures.map((avatar, index) => (
                        <button
                            key={index}
                            className="w-16 h-16 rounded-full border-2 border-transparent hover:border-blue-500"
                            onClick={() => setSelectedProfilePicture(avatar)}>
                            <img
                                src={avatar}
                                alt={`Avatar ${index + 1}`}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </button>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex justify-center mt-8 space-x-4">
                    <button
                        onClick={() => {
                            onClose(true), setSelectedProfilePicture(null)
                        }}
                        className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-3.5 py-0.5 text-white hover:bg-darkGray-300">
                        Cancel
                    </button>
                    <button
                        onClick={() => updateProfilePicture()}
                        className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-5 py-0.5 text-white hover:bg-darkGray-300">
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    )
};

export default ProfilePictureModal;