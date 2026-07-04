import React, { useState } from 'react';
import Modal from 'react-modal';
import { PencilIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { MediaType } from '../../../../Electron/Application/Features/Files/Queries/GetMedia/GetMediaQuery.ts';
import { useUser } from '../../../Context/User/UserContext.tsx';
import { UserActionType } from '../../../Context/User/UserReducer.ts';
import { AvatarService } from '../../../Common/Services/AvatarService.ts';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';
import { Media } from '../../../Models/Media.ts';
import { MediaService } from '../../../Common/Services/MediaService.ts';
import { MediaItem } from '../Chat/MediaBox.tsx';

interface AvatarModelProps {
    isOpen: boolean;
    onClose: (shouldReopenParent: boolean) => void;
}

const AvatarModal: React.FC<AvatarModelProps> = ({ isOpen, onClose }) => {
    const { user, userDispatch } = useUser();
    const [selectedAvatar, setSelectedProfilePicture] = useState<Media | string | null>(null);
    const [isStock, setIsStock] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const avatarService = new AvatarService();
    const mediaService = new MediaService();

    const avatarModules = import.meta.glob('../../../Assets/StockProfilePictures/*.png', { eager: true });
    const predefinedProfilePictures = Object.values(avatarModules).map((mod: any) => mod.default);

    const saveProfilePicture = async () => {
        try {
            setLoading(true);
            const result = await avatarService.updateAvatar(selectedAvatar!, isStock);
            if (result.success) {
                userDispatch({ type: UserActionType.UpdateAvatar, payload: { AvatarKey: result.data } });
                onClose(true);
            } else {
                console.error(result.errorMessage);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const uploadProfilePicture = async () => {
        const media = await mediaService.getLocalMedia(MediaType.Image);
        setSelectedProfilePicture(media![0]);
        setIsStock(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => onClose(false)}
            shouldCloseOnEsc={!loading}
            shouldCloseOnOverlayClick={!loading}
            className="p-4 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[550px] max-auto relative"
            overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center"
            contentLabel="User Details"
        >
            <div className="relative h-full flex flex-col">
                <button
                    onClick={() => onClose(true)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-gray-300 text-xs"
                >
                    ✕
                </button>

                <h3 className="absolute top-1 left-1 text-m text-gray-50">Avatar</h3>

                <div className="flex flex-col items-center mt-8 mb-4">
                    {/* Show Selected Profile Picture */}
                    {selectedAvatar ? (
                        selectedAvatar instanceof Media ? (
                            <MediaItem media={selectedAvatar} className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                            <img
                                src={selectedAvatar}
                                alt="avatar"
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        )
                    ) : (
                        <Avatar
                            className="w-20 h-20"
                            AvatarKey={user?.avatarKey ?? null}
                            Username={user?.username ?? '?'}
                        />
                    )}
                </div>

                <div className="flex justify-center items-center space-x-4 mb-8">
                    {/* Upload Image Option */}
                    <button
                        className="flex flex-col items-center justify-center bg-darkGray-200 hover:bg-darkGray-300 px-1.5 py-1 rounded-lg"
                        onClick={() => uploadProfilePicture()}
                        disabled={loading}
                    >
                        <PhotoIcon className="w-4 h-4 text-gray-200" />
                        <h3 className="font-extralight text-[0.6rem]">image</h3>
                    </button>

                    {/* Text (Initials) Option */}
                    <button className="flex flex-col items-center justify-center bg-darkGray-200 hover:bg-darkGray-300 px-2.5 py-1 rounded-lg">
                        <PencilIcon className="w-4 h-4 text-gray-200" />
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
                            disabled={loading}
                        >
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
                        className="text-[0.8rem] font-semibold bg-darkGray-200 rounded-full px-3.5 py-0.5 text-white hover:bg-darkGray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => saveProfilePicture()}
                        disabled={!selectedAvatar || loading}
                        className={`text-[0.8rem] font-semibold rounded-full px-5 py-0.5 ${!selectedAvatar
                                ? 'bg-darkGray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-darkGray-200 text-white hover:bg-darkGray-300'
                            }
                                ${loading ? 'cursor-wait' : ''}`}
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AvatarModal;
