import React, { useEffect, useState } from 'react';
import { delay } from '../../../../Shared/HelperFunctions.ts';
import ToolTip from '../../../Common/Components/Utility/ToolTip.tsx';
import { PendingContact } from '../../../Models/PendingContact.ts';
import { usePendingContacts } from '../../../Context/PendingContact/PendingContactContext.tsx';
import { PendingContactActionType } from '../../../Context/PendingContact/PendingContactReducer.ts';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';
import { Result } from '../../../../Shared/Result/Result.ts';
import { FriendContract } from '../../../../Shared/Models/FriendContract.ts';
import { AcceptFriendRequestCommand } from '../../../../Shared/Friends/AcceptFriendRequest.ts';
import { DeclineFriendRequestCommand } from '../../../../Shared/Friends/DeclineFriendRequest.ts';
import { CaretLeftIcon, CheckIcon, ProhibitIcon, WarningIcon, XIcon } from '@phosphor-icons/react';

interface PendingContactPage {
    pendingContact: PendingContact;
    onClose: () => void;
}

type LoadingAction = 'accept' | 'decline' | 'block' | null;

const PendingContactPage: React.FC<PendingContactPage> = ({ pendingContact, onClose }) => {
    const [slideClass, setSlideClass] = useState('translate-x-full');
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
    const { pendingContactDispatch } = usePendingContacts();

    useEffect(() => {
        setSlideClass('translate-x-0');
    }, []);

    const handleSlideOut = () => {
        setSlideClass('translate-x-full');
        setTimeout(() => onClose(), 300);
    };

    const handleAccept = async () => {
        const result = await window.electron.sendRequestAsync<Result<FriendContract>>(
            new AcceptFriendRequestCommand(pendingContact.id),
        );
        if (result.success) {
            pendingContactDispatch({ type: PendingContactActionType.Remove, payload: { id: pendingContact.id } });
            setLoadingAction('accept');
        }
        await delay(750);
        setLoadingAction(null);
        onClose();
    };

    const handleDecline = async () => {
        const result = await window.electron.sendRequestAsync<Result>(
            new DeclineFriendRequestCommand(pendingContact.id),
        );
        if (result.success) {
            pendingContactDispatch({ type: PendingContactActionType.Remove, payload: { id: pendingContact.id } });
            setLoadingAction('decline');
        }
        await delay(750);
        setLoadingAction(null);
        onClose();
    };

    const handleBlock = async () => {
        setLoadingAction('block');
        await delay(750);
        setLoadingAction(null);
    };

    return (
        <>
            <div className={`absolute inset-0  text-fg shadow-lg transition-transform duration-300 ${slideClass}`}>
                <div className="flex flex-col h-full">
                    {/* Top Bar */}
                    <div className="flex items-center p-3 shrink-0">
                        <button className="text-fg-subtle hover:text-fg-muted" onClick={handleSlideOut}>
                            <CaretLeftIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center mt-4">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-media mb-3">
                                <Avatar
                                    className="w-11 h-11"
                                    AvatarKey={pendingContact.avatarKey}
                                    Username={pendingContact.username}
                                />
                            </div>
                            <h2 className="text-lg font-semibold">
                                {pendingContact.displayName || pendingContact.username}
                            </h2>
                            <p className="text-sm text-fg-subtle mt-1">{pendingContact.id}</p>
                        </div>

                        {/* Divider */}
                        <div className="mt-6 mx-auto w-3/4 border-t border-line" />
                        <div className="mt-4 flex items-center justify-center px-4 text-fg-muted">
                            <WarningIcon className="w-5 h-5 mr-2 text-warning" />
                            <p className="text-sm text-center">
                                Be careful accepting requests from people you do not know.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center items-center space-x-4 mt-4">
                            <ToolTip content="Accept friend request">
                                <button
                                    className="p-2 bg-accent hover:bg-accent-hover rounded-full cursor-pointer transition duration-150 ease-in-out transform hover:scale-105"
                                    onClick={() => handleAccept()}
                                >
                                    {loadingAction === 'accept' ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-fg-on-accent rounded-full" />
                                    ) : (
                                        <CheckIcon className="h-4 w-4 text-fg-on-accent" />
                                    )}
                                </button>
                            </ToolTip>
                            <ToolTip content="Decline friend request">
                                <button
                                    className="p-2 bg-surface hover:bg-surface-hover rounded-full cursor-pointer transition duration-150 ease-in-out transform hover:scale-105"
                                    onClick={() => handleDecline()}
                                >
                                    {loadingAction === 'decline' ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-fg rounded-full" />
                                    ) : (
                                        <XIcon className="h-4 w-4 text-fg" />
                                    )}
                                </button>
                            </ToolTip>
                            <ToolTip content="Block user">
                                <button
                                    className="p-2 bg-danger hover:bg-danger-hover rounded-full cursor-pointer transition duration-150 ease-in-out transform hover:scale-105"
                                    onClick={() => handleBlock()}
                                >
                                    {loadingAction === 'block' ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-fg-on-accent rounded-full" />
                                    ) : (
                                        <ProhibitIcon className="h-4 w-4 text-fg-on-accent" />
                                    )}
                                </button>
                            </ToolTip>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PendingContactPage;
