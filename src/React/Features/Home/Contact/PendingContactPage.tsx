import React, { useEffect, useState } from 'react';
import { delay } from '@/Shared/HelperFunctions.ts';
import { PendingContact } from '@/React/Models/PendingContact.ts';
import { usePendingContacts } from '@/React/Context/PendingContact/PendingContactContext.tsx';
import { PendingContactActionType } from '@/React/Context/PendingContact/PendingContactReducer.ts';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import Button from '@/React/Common/Components/Button/Button.tsx';
import { AcceptFriendRequestCommand } from '@/Shared/Friends/AcceptFriendRequest.ts';
import { DeclineFriendRequestCommand } from '@/Shared/Friends/DeclineFriendRequest.ts';
import { CaretLeftIcon, CheckIcon, ProhibitIcon, ShieldWarningIcon, XIcon } from '@phosphor-icons/react';

interface PendingContactPage {
    pendingContact: PendingContact;
    onClose: () => void;
}

type LoadingAction = 'accept' | 'decline' | 'block' | null;

const Spinner: React.FC = () => (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const PendingContactPage: React.FC<PendingContactPage> = ({ pendingContact, onClose }) => {
    const [slideClass, setSlideClass] = useState('translate-x-full');
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
    const [error, setError] = useState<string | null>(null);
    const { pendingContactDispatch } = usePendingContacts();
    const name = pendingContact.displayName || pendingContact.username;

    useEffect(() => {
        setSlideClass('translate-x-0');
    }, []);

    const handleSlideOut = () => {
        setSlideClass('translate-x-full');
        setTimeout(() => onClose(), 300);
    };

    const respond = async (action: 'accept' | 'decline') => {
        setLoadingAction(action);
        setError(null);

        const result =
            action === 'accept'
                ? await window.electron.sendRequestAsync(new AcceptFriendRequestCommand(pendingContact.id))
                : await window.electron.sendRequestAsync(new DeclineFriendRequestCommand(pendingContact.id));

        if (!result.success) {
            setLoadingAction(null);
            setError(
                action === 'accept'
                    ? 'Couldn’t accept the request. Try again.'
                    : 'Couldn’t decline the request. Try again.',
            );
            return;
        }

        pendingContactDispatch({ type: PendingContactActionType.Remove, payload: { id: pendingContact.id } });
        setLoadingAction(null);
        onClose();
    };

    const handleBlock = async () => {
        setLoadingAction('block');
        await delay(750);
        setLoadingAction(null);
    };

    const busy = loadingAction !== null;

    return (
        <div className={`absolute inset-0 text-fg shadow-lg transition-transform duration-300 ${slideClass}`}>
            <div className="flex h-full flex-col">
                <div className="relative flex shrink-0 items-center p-3">
                    <button className="text-fg-subtle hover:text-fg-muted" onClick={handleSlideOut} aria-label="Back">
                        <CaretLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-fg-muted">
                        Friend request
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-10">
                    <div className="mx-auto flex max-w-sm flex-col items-center pt-10">
                        <div className="h-24 w-24 overflow-hidden rounded-full bg-media ring-4 ring-surface">
                            <Avatar
                                className="h-full w-full text-2xl"
                                AvatarKey={pendingContact.avatarKey}
                                Username={pendingContact.username}
                                Seed={pendingContact.id}
                            />
                        </div>

                        <h2 className="mt-6 max-w-full truncate text-xl font-semibold">{name}</h2>
                        <span className="mt-2.5 max-w-full truncate rounded-full bg-surface px-2.5 py-0.5 font-mono text-xs text-fg-subtle">
                            {pendingContact.id}
                        </span>
                        <p className="mt-5 text-sm text-fg-muted">wants to add you as a friend</p>

                        <div className="mt-10 grid w-full grid-cols-2 gap-3">
                            <Button
                                variant="primary"
                                size="md"
                                className="h-10 gap-2"
                                disabled={busy}
                                onClick={() => void respond('accept')}
                            >
                                {loadingAction === 'accept' ? (
                                    <Spinner />
                                ) : (
                                    <CheckIcon className="h-4 w-4" weight="bold" />
                                )}
                                Accept
                            </Button>
                            <Button
                                variant="secondary"
                                size="md"
                                className="h-10 gap-2"
                                disabled={busy}
                                onClick={() => void respond('decline')}
                            >
                                {loadingAction === 'decline' ? (
                                    <Spinner />
                                ) : (
                                    <XIcon className="h-4 w-4" weight="bold" />
                                )}
                                Decline
                            </Button>
                        </div>

                        {error && <p className="mt-3 text-xs text-danger-fg">{error}</p>}

                        <div className="mt-10 flex w-full gap-3.5 rounded-xl border border-line bg-surface p-5">
                            <ShieldWarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning" weight="fill" />
                            <div className="text-sm">
                                <p className="font-medium text-fg">Only accept people you know</p>
                                <p className="mt-1.5 leading-relaxed text-fg-subtle">
                                    Once accepted, {name} can message you.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 w-full border-t border-line pt-4">
                            <button
                                className="flex w-full items-center gap-3 rounded-md px-3 py-3.5 text-sm text-danger-fg hover:bg-surface-hover disabled:opacity-50"
                                disabled={busy}
                                onClick={() => void handleBlock()}
                            >
                                {loadingAction === 'block' ? <Spinner /> : <ProhibitIcon className="h-5 w-5" />}
                                Block {name}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingContactPage;
