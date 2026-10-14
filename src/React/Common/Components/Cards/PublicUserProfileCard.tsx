import React, { useState } from 'react';
import { FriendshipStatus } from '@/Shared/Enums/FriendshipStatus.ts';
import { FriendshipDirection } from '@/Shared/Enums/FriendshipDirection.ts';
import { delay } from '@/Shared/HelperFunctions.ts';
import ToolTip from '../Utility/ToolTip.tsx';
import { useContacts } from '@/React/Context/Contacts/ContactContext.tsx';
import { ContactActionType } from '@/React/Context/Contacts/ContactReducer.ts';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import Avatar from '../Avatar/Avatar.tsx';
import { SendFriendRequestCommand } from '@/Shared/Friends/SendFriendRequest.ts';
import { DeclineFriendRequestCommand } from '@/Shared/Friends/DeclineFriendRequest.ts';
import { AcceptFriendRequestCommand } from '@/Shared/Friends/AcceptFriendRequest.ts';
import { Contact } from '@/React/Models/Contact.ts';
import { CheckIcon, PlusIcon, XIcon } from '@phosphor-icons/react';

interface PublicUserProfileCardProps {
    username: string;
    friendTag: string;
    displayName: string | null;
    avatarKey: string | null;
    friendshipStatus?: FriendshipStatus;
    friendshipDirection: FriendshipDirection;
}

const PublicUserProfileCard: React.FC<PublicUserProfileCardProps> = ({
    username,
    friendTag,
    displayName,
    avatarKey,
    friendshipStatus,
    friendshipDirection,
}) => {
    const { user } = useUser();
    const [friendAdded, setFriendAdded] = useState<boolean>(false);
    const [currentFriendshipStatus, setCurrentFriendshipStatus] = useState<FriendshipStatus | undefined>(
        friendshipStatus,
    );
    const [currentFriendshipDirection, setCurrentFriendshipDirection] =
        useState<FriendshipDirection>(friendshipDirection);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { contactDispatch } = useContacts();

    const onAddFriend = async () => {
        if (friendAdded) return;

        const result = await window.electron.sendRequestAsync(new SendFriendRequestCommand(friendTag));
        if (result.success) {
            setFriendAdded(true);
            setIsLoading(true);
        }

        await delay(750);
        setIsLoading(false);
    };

    const onAcceptFriendRequest = async () => {
        const result = await window.electron.sendRequestAsync(
            new AcceptFriendRequestCommand(friendTag),
        );
        if (result.success && result.data) {
            const friend = result.data;
            setCurrentFriendshipStatus(FriendshipStatus.Accepted);
            setCurrentFriendshipDirection(FriendshipDirection.None);
            setIsLoading(true);
            contactDispatch({
                type: ContactActionType.Add,
                payload: new Contact(
                    friend.id,
                    friend.username,
                    friend.displayName,
                    friend.avatarKey,
                    friend.connectionIds,
                ),
            });
        }

        await delay(750);
        setIsLoading(false);
    };

    const onDeclineFriendRequest = async () => {
        console.log(friendTag);
        const result = await window.electron.sendRequestAsync(new DeclineFriendRequestCommand(friendTag));
        if (result.success) {
            setFriendAdded(false);
            setCurrentFriendshipStatus(undefined);
            setCurrentFriendshipDirection(FriendshipDirection.None);
            setIsLoading(true);
        }

        await delay(750);
        setIsLoading(false);
    };

    const renderFriendButton = () => {
        if (isLoading) {
            return (
                <ToolTip content="Processing...">
                    <button className="p-1 flex items-center justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-t-transparent border-fg rounded-full" />
                    </button>
                </ToolTip>
            );
        }
        if (user?.userTag === friendTag) return null;

        if (currentFriendshipStatus === FriendshipStatus.Accepted) {
            return (
                <ToolTip content={'already friends'}>
                    <button className="p-2 mr-2 bg-success rounded-full cursor-default">
                        <CheckIcon className="h-3 w-3 text-fg-on-accent" />
                    </button>
                </ToolTip>
            );
        }

        if (
            currentFriendshipStatus === FriendshipStatus.Pending &&
            currentFriendshipDirection === FriendshipDirection.Received
        ) {
            return (
                <>
                    <ToolTip content="Decline friend request">
                        <button
                            onClick={onDeclineFriendRequest}
                            className="p-2 bg-surface-hover hover:bg-overlay-hover rounded-full cursor-pointer transition-colors"
                        >
                            <XIcon className="h-3 w-3 text-fg" />
                        </button>
                    </ToolTip>
                    <ToolTip content="Accept friend request">
                        <button
                            onClick={onAcceptFriendRequest}
                            className="p-2 bg-accent hover:bg-accent-hover rounded-full cursor-pointer transition-colors"
                        >
                            <CheckIcon className="h-3 w-3 text-fg-on-accent" />
                        </button>
                    </ToolTip>
                </>
            );
        }

        if (
            (currentFriendshipStatus === FriendshipStatus.Pending &&
                currentFriendshipDirection === FriendshipDirection.Sent) ||
            friendAdded
        ) {
            return (
                <ToolTip content="Cancel friend request">
                    <button
                        onClick={onDeclineFriendRequest}
                        className="p-2 bg-surface-hover hover:bg-overlay-hover rounded-full cursor-pointer transition-colors"
                    >
                        <XIcon className="h-3 w-3 text-fg" />
                    </button>
                </ToolTip>
            );
        }
        return (
            <ToolTip content="Send friend request">
                <button
                    onClick={onAddFriend}
                    className="p-2 bg-surface-hover hover:bg-overlay-hover rounded-full cursor-pointer transition-colors"
                >
                    <PlusIcon className="h-3 w-3 text-fg" />
                </button>
            </ToolTip>
        );
    };

    return (
        <div className="flex items-center justify-between p-3 bg-field rounded-lg shadow-lg w-full">
            <div className="flex items-center">
                <Avatar className="w-11 h-11" AvatarKey={avatarKey ?? null} Username={username ?? '?'} />
                <div className="ml-3">
                    <div className="text-fg font-semibold">{displayName || username}</div>
                    <div className="text-fg-subtle text-sm">@{friendTag}</div>
                </div>
            </div>

            {renderFriendButton()}
        </div>
    );
};

export default PublicUserProfileCard;
