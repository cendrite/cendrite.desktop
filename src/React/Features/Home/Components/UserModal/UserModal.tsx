import React from "react";
import Modal from "react-modal";
import {useUser} from "../../../../Common/Context/UserContext.tsx";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({isOpen, onClose }) => {
    const {user} = useUser();

    return (
        <Modal
        isOpen = {isOpen}
        onRequestClose = {onClose}
        className= "p-4 bg-zinc-700 text-white rounded-xl shadow-lg w-[350px] h-[500px] max-auto relative"
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
                        <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-2xl text-gray-300">
                            {user?.username[0] || "?"}
                        </div>
                    )}

                    {/* Edit Button */}
                    <button className="text-sm text-blue-500 font-semibold hover:underline mt-2">
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
                <div className="mt-6">
                    <button className="text-sm text-red-500 font-semibold hover:underline">
                        Log ud
                    </button>
                </div>
            </div>
        </Modal>
    )
};

export default UserModal;