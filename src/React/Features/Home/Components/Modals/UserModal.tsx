import React, {useState} from "react";
import Modal from "react-modal";
import {useUser} from "../../../../Common/Context/UserContext.tsx";
import LogoutModal from "./LogoutModal.tsx";
import {
    UpdateProfilePictureCommand
} from "../../../../../Electron/Application/Features/User/Commands/Update/ProfilePicture/UpdateProfilePictureCommand.ts";


interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({isOpen, onClose}) => {
    const {user} = useUser();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const setProfilePicture = async ()  => {
        console.log("Change Picture");
        const result = await window.electron.sendRequestAsync(new UpdateProfilePictureCommand());
        console.log(result);
    };

    return (
        <>
            {!isLogoutModalOpen &&
                <Modal
                    isOpen={isOpen}
                    onRequestClose={onClose}
                    className="p-4 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[550px] max-auto relative"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center"
                    contentLabel="User Details">
                    <div className="relative h-full flex flex-col">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-300"
                        >
                            ✕
                        </button>

                        {/* Profile Section */}
                        <div className="flex flex-col items-center">
                            {/* Profile Picture */}
                            {user?.profilePictureUrl ? (
                                <img
                                    src={user.profilePictureUrl}
                                    alt={`${user.username}'s profile`}
                                    className="w-20 h-20 rounded-full mb-4"
                                />
                            ) : (
                                <div
                                    className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-2xl font-extralight text-blue-900">
                                    {user?.username[0].concat(user?.username[1]).toUpperCase() || "?"}
                                </div>
                            )}

                            {/* Edit Button */}
                            <button className="text-sm text-blue-500 font-semibold hover:underline mt-2"
                            onClick={setProfilePicture}>
                                Change Picture
                            </button>

                            {/* User Details */}
                            <h2 className="text-lg font-semibold">{user?.displayName || user?.username}</h2>
                            <p className="text-sm text-gray-400 mt-1">{user?.userTag}</p>
                        </div>

                        {/* About Section */}
                        <div className="mt-6">
                            <h3 className="text-sm text-gray-500 mb-1">Om</h3>
                            <p className="text-sm text-gray-400">
                                Din profil og ændringerne vil være synlige for folk, du skriver til,
                                kontakter og grupper.
                            </p>
                        </div>

                        {/* Username Section */}
                        <div className="mt-6">
                            <h3 className="text-sm text-gray-500 mb-1">Brugernavn</h3>
                            <p className="text-sm text-gray-400">
                                Folk kan nu sende dig beskeder ved hjælp af dit valgfrie brugernavn,
                                så du ikke behøver at dele dit telefonnummer.
                            </p>
                        </div>

                        {/* Logout Section */}
                        <div className="flex justify-center items-center mt-auto">
                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-3.5 py-0.5 text-white hover:bg-darkGray-300">
                                Logout
                            </button>
                        </div>
                    </div>
                </Modal>}

            <LogoutModal isOpen={isLogoutModalOpen} onClose={(shouldReopenParent) => {
                setIsLogoutModalOpen(false);
                if (shouldReopenParent) {
                    return;
                }
                onClose();
            }}/>
        </>
    )
};

export default UserModal;