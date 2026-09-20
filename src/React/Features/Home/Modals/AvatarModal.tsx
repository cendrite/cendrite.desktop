import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { PencilIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MediaType } from '../../../../Electron/Application/Features/Files/Contracts/GetMedia.ts';
import { useUser } from '../../../Context/User/UserContext.tsx';
import { UserActionType } from '../../../Context/User/UserReducer.ts';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';
import { Media } from '../../../Models/Media.ts';
import { MediaService } from '../../../Common/Services/MediaService.ts';
import { MediaItem } from '../Chat/MediaBox.tsx';
import { Result } from '../../../../Shared/Result/Result.ts';
import { UpdateAvatarCommand } from '../../../../Electron/Application/Features/User/Contracts/UpdateAvatar.ts';
import Button from '../../../Common/Components/Button/Button.tsx';

interface AvatarModelProps {
    isOpen: boolean;
    onClose: () => void;
}

const updateAvatar = (avatar: Media): Promise<Result<string>> =>
    window.electron.sendRequestAsync<Result<string>>(
        new UpdateAvatarCommand(avatar.content, avatar.type, 'profilePicture.png'),
    );

const stockAvatarToMedia = async (imageUrl: string): Promise<Media> => {
    const response = await fetch(imageUrl);
    const bytes = new Uint8Array(await response.arrayBuffer());
    return new Media(imageUrl, 'image/png', bytes);
};

const AvatarModal: React.FC<AvatarModelProps> = ({ isOpen, onClose }) => {
    const { user, userDispatch } = useUser();
    const [selectedAvatar, setSelectedAvatar] = useState<Media | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const mediaService = new MediaService();

    const avatarModules = import.meta.glob('../../../Assets/StockProfilePictures/*.png', { eager: true });
    const predefinedProfilePictures = Object.values(avatarModules).map((mod: any) => mod.default);

    const close = () => {
        setSelectedAvatar(null);
        onClose();
    };

    const saveProfilePicture = async () => {
        try {
            setLoading(true);
            const result = await updateAvatar(selectedAvatar!);
            if (result.success) {
                userDispatch({ type: UserActionType.UpdateAvatar, payload: { AvatarKey: result.data } });
                close();
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
        setSelectedAvatar(media![0]);
    };

    const selectStockAvatar = async (imageUrl: string) => {
        try {
            setSelectedAvatar(await stockAvatarToMedia(imageUrl));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={() => {
                if (!loading) {
                    close();
                }
            }}
            className="relative z-[1010]"
        >
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative flex h-[550px] w-[350px] flex-col rounded-xl bg-surface p-4 text-fg shadow-lg">
                    <button
                        onClick={close}
                        aria-label="Close"
                        className="absolute right-3 top-3 text-fg-subtle hover:text-fg-muted"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>

                    <DialogTitle className="text-sm text-fg">Avatar</DialogTitle>

                    <div className="mt-6 mb-4 flex flex-col items-center">
                        {selectedAvatar ? (
                            <MediaItem media={selectedAvatar} className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                            <Avatar
                                className="w-20 h-20"
                                AvatarKey={user?.avatarKey ?? null}
                                Username={user?.username ?? '?'}
                            />
                        )}
                    </div>

                    <div className="mb-8 flex items-center justify-center space-x-4">
                        <button
                            className="flex flex-col items-center justify-center bg-overlay hover:bg-surface-hover px-1.5 py-1 rounded-lg"
                            onClick={() => uploadProfilePicture()}
                            disabled={loading}
                        >
                            <PhotoIcon className="w-4 h-4 text-fg-muted" />
                            <h3 className="font-extralight text-[0.6rem]">image</h3>
                        </button>

                        <button className="flex flex-col items-center justify-center bg-overlay hover:bg-surface-hover px-2.5 py-1 rounded-lg">
                            <PencilIcon className="w-4 h-4 text-fg-muted" />
                            <h3 className="font-extralight text-[0.6rem]">text</h3>
                        </button>
                    </div>

                    <div className="mx-auto grid grid-cols-3 items-center justify-center gap-6">
                        {predefinedProfilePictures.map((avatar, index) => (
                            <button
                                key={index}
                                className="w-16 h-16 rounded-full border-2 border-transparent hover:border-accent"
                                onClick={() => selectStockAvatar(avatar)}
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

                    <div className="mt-auto flex justify-center space-x-4">
                        <Button onClick={close}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={() => saveProfilePicture()}
                            disabled={!selectedAvatar || loading}
                            className={loading ? 'cursor-wait' : undefined}
                        >
                            Save
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default AvatarModal;
