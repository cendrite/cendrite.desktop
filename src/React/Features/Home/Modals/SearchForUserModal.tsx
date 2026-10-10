import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import SearchBar from '../SearchBar.tsx';
import PublicUserProfileCard from '../../../Common/Components/Cards/PublicUserProfileCard.tsx';
import { useUser } from '../../../Context/User/UserContext.tsx';
import { Result } from '../../../../Shared/Result/Result.ts';
import {
    GetProfileByTagQuery,
    ProfileDto,
} from '../../../../Electron/Application/Features/Friends/Contracts/GetProfileByTag.ts';
import { XIcon } from '@phosphor-icons/react';

interface SearchForUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchForUserModal: React.FC<SearchForUserModalProps> = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const userId = useMemo(() => user?.id, [user]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResult, setSearchResult] = useState<ProfileDto | null>(null);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleOnClose = () => {
        setSearchQuery('');
        setSearchResult(null);
        setError(null);
        onClose();
    };

    useEffect(() => {
        if (searchQuery.length === 0) {
            setSearchResult(null);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        // Guards against an earlier request resolving after a later one and overwriting it.
        let cancelled = false;

        const timeoutId = setTimeout(async () => {
            const result = await window.electron.sendRequestAsync<Result<ProfileDto | void>>(
                new GetProfileByTagQuery(searchQuery),
            );

            if (cancelled) {
                return;
            }

            if (!result.success) {
                setSearchResult(null);
                setError('Something went wrong while searching');
            } else if (result.data) {
                setSearchResult(result.data);
            } else {
                setSearchResult(null);
                setError('No user found');
            }

            setLoading(false);
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [searchQuery, userId]);

    return (
        <Dialog open={isOpen} onClose={handleOnClose} className="relative z-[1000]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative w-[360px] rounded-xl bg-surface p-4 text-fg shadow-lg">
                    <button
                        onClick={handleOnClose}
                        aria-label="Close"
                        className="absolute right-3 top-3 text-fg-subtle hover:text-fg-muted"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>

                    <DialogTitle className="mb-3 text-sm font-medium text-fg-muted">Find a user</DialogTitle>

                    <SearchBar
                        autoFocus
                        placeHolder="Search by user tag"
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />

                    <div className="mt-3 min-h-[84px]">
                        {isLoading && (
                            <div className="flex h-[84px] items-center justify-center">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-transparent" />
                            </div>
                        )}

                        {!isLoading && error && <p className="pt-6 text-center text-sm text-fg-subtle">{error}</p>}

                        {!isLoading && !error && searchResult && (
                            <PublicUserProfileCard
                                username={searchResult.username}
                                friendTag={searchResult.userTag}
                                displayName={searchResult.displayName}
                                avatarKey={searchResult.avatarKey}
                                friendshipStatus={searchResult.friendshipStatus}
                                friendshipDirection={searchResult.friendshipDirection}
                            />
                        )}

                        {!isLoading && !error && !searchResult && (
                            <p className="pt-6 text-center text-sm text-fg-faint">
                                Search by user tag to add a contact
                            </p>
                        )}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default SearchForUserModal;
