import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { ChatService } from '@/React/Common/Services/ChatService.ts';
import { GROUP_NAME_MAX_LENGTH } from '@/Shared/Groups/RenameGroup';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface RenameGroupModalProps {
    chat: ChatViewModel;
    isOpen: boolean;
    onClose: () => void;
}

const RenameGroupModal: React.FC<RenameGroupModalProps> = ({ chat, isOpen, onClose }) => {
    const chatService = useMemo(() => new ChatService(), []);
    const [name, setName] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setName(chat.groupName ?? '');
        setError(null);
    }, [isOpen, chat.groupName]);

    const close = () => {
        if (!pending) onClose();
    };

    const handleRename = async () => {
        setPending(true);
        setError(null);

        const renameError = await chatService.renameGroup(chat.id, name);

        setPending(false);

        if (renameError) {
            setError(renameError);
            return;
        }

        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1200]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[380px] rounded-xl bg-surface p-6 text-fg shadow-lg">
                    <DialogTitle className="mb-5 text-sm font-medium text-fg-muted">Rename group</DialogTitle>

                    <input
                        autoFocus
                        aria-label="Group name"
                        className="w-full rounded-md bg-field px-3 py-2 text-sm text-fg focus:outline-none"
                        maxLength={GROUP_NAME_MAX_LENGTH}
                        placeholder="Group name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && name.trim() && !pending) handleRename();
                        }}
                    />

                    {error && <p className="mt-3 text-sm text-danger-fg">{error}</p>}

                    <div className="mt-6 flex justify-end space-x-3">
                        <Button onClick={close} disabled={pending}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleRename} disabled={!name.trim() || pending}>
                            {pending ? 'Renaming…' : 'Rename'}
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default RenameGroupModal;
