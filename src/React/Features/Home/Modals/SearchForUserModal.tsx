import Modal from "react-modal";
import React, {useEffect, useMemo, useState} from "react";
import SearchBar from "../SearchBar.tsx";
import PublicUserProfileCard from "../../../Common/Components/Cards/PublicUserProfileCard.tsx";
import { useUser } from "../../../Context/User/UserContext.tsx";
import { Result } from "../../../../Shared/Result/Result.ts";
import {
    GetProfileByTagQuery,
    ProfileDto,
} from "../../../../Electron/Application/Features/Friends/Contracts/GetProfileByTag.ts";

interface SearchForUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchForUserModal: React.FC<SearchForUserModalProps> = ({isOpen, onClose}) => {
    const { user } = useUser();
    const userId = useMemo(() => user?.id, [user]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResult, setSearchResult] = useState<ProfileDto | null>(null);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleOnClose = () => {
        setSearchQuery("");
        setSearchResult(null);
        setError(null);
        onClose();
    }

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setSearchResult(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.length === 0) {
            setSearchResult(null);
            setLoading(false);
            setError(null); // Reset error when search is cleared
            return;
        }

        setLoading(true);
        setError(null); // Reset previous errors

        const fetchUserProfile = async () => {
            const result = await window.electron.sendRequestAsync<Result<ProfileDto | void>>(
                new GetProfileByTagQuery(searchQuery),
            );

            if (!result.success) {
                setError("An error occurred while searching for the user");
                setSearchResult(null);
                return;
            }
            console.log(result.data);
            if (result.data) {
                setSearchResult(result.data);
            } else {
                setSearchResult(null);
                setError("No user found");
            }

            setLoading(false);
        };

        const timeoutId = setTimeout(async() => {
            await fetchUserProfile();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, userId]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onRequestClose={handleOnClose}
                className="p-4 bg-darkGray-500 text-white rounded-xl shadow-lg w-[350px] h-[175px] max-auto relative"
                overlayClassName="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center"
                contentLabel="User Details">
                <div className="relative h-full flex flex-col">
                    {/* Close Button */}
                    <button
                        onClick={handleOnClose}
                        className="absolute right-0.5 text-gray-400 hover:text-gray-300 text-xs"
                    >
                        ✕
                    </button>

                    <div className="p-4 justify-center">
                        {/* Search Bar */}
                        <SearchBar
                            placeHolder={"Search for user"}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e)}
                        />

                        {/* Loading Indicator */}
                        {isLoading && <div className="mt-2 text-sm text-center text-gray-400">Loading...</div>}

                        {/* Error Message */}
                        {error && <div className="mt-2 text-sm text-center text-gray-400">{error}</div>}

                        {/* Display Profile Card if a User is Found */}
                        {!isLoading && searchResult && (
                            <PublicUserProfileCard
                                username={searchResult.username}
                                friendTag={searchResult.userTag}
                                displayName={searchResult.displayName}
                                avatarKey={searchResult.avatarKey}
                                friendshipStatus={searchResult.friendshipStatus}
                                friendshipDirection={searchResult.friendshipDirection}
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default SearchForUserModal;
