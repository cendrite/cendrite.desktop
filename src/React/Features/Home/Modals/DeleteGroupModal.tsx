import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { useChatSettings } from '@/React/Common/Hooks/ChatSettings.ts';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface DeleteGroupModalProps {
    chat: ChatViewModel;
    isOpen: boolean;
    onClose: () => void;
}

const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({ chat, isOpen, onClose }) => {
    const { deleteGroup } = useChatSettings();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) setError(null);
    }, [isOpen]);

    const close = () => {
        if (!pending) onClose();
    };

    const handleDelete = async () => {
        setPending(true);
        setError(null);

        const deleteError = await deleteGroup(chat);

        setPending(false);

        if (deleteError) {
            setError(deleteError);
            return;
        }

        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1200]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[380px] rounded-xl bg-surface px-6 py-8 text-fg shadow-lg">
                    <div className="text-center">
                        <DialogTitle className="text-lg font-semibold">Delete group</DialogTitle>
                        <p className="mt-2 text-sm text-fg-subtle">
                            {chat.groupName ?? 'This group'} will be deleted for every member, along with all of its messages. This cannot be undone.
                        </p>
                    </div>

                    {error && <p className="mt-4 text-center text-sm text-danger-fg">{error}</p>}

                    <div className="mt-8 flex justify-center space-x-4">
                        <Button onClick={close} disabled={pending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={pending}>
                            {pending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default DeleteGroupModal;
