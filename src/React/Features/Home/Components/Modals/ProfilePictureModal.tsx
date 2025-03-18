import React, {useState} from "react";
import Modal from "react-modal";
import {useUser} from "../../../../Common/Context/UserContext.tsx";
import {PencilIcon, PhotoIcon} from "@heroicons/react/24/outline";
import {GetMediaDto} from "../../../../../Electron/Application/Features/Files/Queries/GetMedia/GetMediaDto.ts";
import {Result} from "../../../../../Shared/Result/Result.ts";
import {
    GetMediaQuery,
    MediaType
} from "../../../../../Electron/Application/Features/Files/Queries/GetMedia/GetMediaQuery.ts";
import {ProfilePictureService} from "../../Services/ProfilePictureService.ts";

interface ProfilePictureModalProps {
    isOpen: boolean;
    onClose: (shouldReopenParent: boolean) => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({isOpen, onClose}) => {
    const {user, updateUser} = useUser();
    const [selectedProfilePicture, setSelectedProfilePicture] = useState<string | null>(null);
    const [isStock, setIsStock] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const profilePictureService = new ProfilePictureService();

    const avatarModules = import.meta.glob("../../../../Assets/StockProfilePictures/*.png", { eager: true });
    const predefinedProfilePictures = Object.values(avatarModules).map((mod: any) => mod.default);


    const saveProfilePicture = async () => {
        try {
            setLoading(true);
            const result = await profilePictureService.updateProfilePicture(user!.id!, selectedProfilePicture!, isStock);
            if (result.success) {
                updateUser({base64ProfilePicture: selectedProfilePicture!});
                onClose(true);
            } else {
                console.error(result.errorMessage);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const uploadProfilePicture = async () => {
        const base64Image = await window.electron.sendRequestAsync<Result<GetMediaDto>>(new GetMediaQuery(MediaType.Image));
        if (base64Image.success) {
            setSelectedProfilePicture(base64Image.data!.media);
            setIsStock(false);
        } else {
            console.error(base64Image.errorMessage);
        }
    }

    return (
        <Modal isOpen={isOpen}
               onRequestClose={() => onClose(false)}
               shouldCloseOnEsc={!loading}
               shouldCloseOnOverlayClick={!loading}
               className="p-4 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[550px] max-auto relative"
               overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center"
               contentLabel="User Details">
            <div className="relative h-full flex flex-col">
                <button
                    onClick={() => onClose(true)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-gray-300 text-xs">
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
                    ) : user?.base64ProfilePicture ? (
                        <img
                            src={user.base64ProfilePicture}
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
                        className="flex flex-col items-center justify-center bg-darkGray-200 hover:bg-darkGray-300 px-1.5 py-1 rounded-lg"
                        onClick={() => uploadProfilePicture()}
                        disabled={loading}>
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
                            onClick={() => {
                                setSelectedProfilePicture(avatar);
                                setIsStock(true);
                            }}
                            disabled={loading}>
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
                            onClose(true);
                            setSelectedProfilePicture(null);
                            setIsStock(false);
                        }}
                        className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-3.5 py-0.5 text-white hover:bg-darkGray-300">
                        Cancel
                    </button>
                    <button
                        onClick={() => saveProfilePicture()}
                        disabled={!selectedProfilePicture || loading}
                        className={`text-[0.8rem] font-semibold rounded-full px-5 py-0.5 ${
                            !selectedProfilePicture
                                ? "bg-darkGray-200 text-gray-400 cursor-not-allowed"
                                : "bg-darkGray-200 text-white hover:bg-darkGray-300"}
                                ${loading ? "cursor-wait" : ""}`}>
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    )
};

export default ProfilePictureModal;