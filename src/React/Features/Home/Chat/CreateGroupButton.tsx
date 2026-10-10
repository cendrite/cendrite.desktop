import { Contact } from '../../../Models/Contact';
import GroupModal from '../Modals/GroupModal';
import React from 'react';
import { UsersThreeIcon } from '@phosphor-icons/react';

const CreateGroupButton: React.FC<{ contact: Contact | null }> = ({ contact }) => {
    const [isGroupModalOpen, setIsGroupModalOpen] = React.useState(false);

    const openGroupModal = () => {
        setIsGroupModalOpen(true);
    };

    return (
        <>
            <button
                onClick={openGroupModal}
                className="flex items-center justify-center hover:bg-surface-hover rounded-lg p-2"
            >
                <UsersThreeIcon className="w-5 h-5 text-fg-muted" />
            </button>
            <GroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} contact={contact} />
        </>
    );
};

export default CreateGroupButton;
