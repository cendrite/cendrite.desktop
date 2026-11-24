import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { useChatSettings } from '@/React/Common/Hooks/ChatSettings.ts';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface LeaveGroupModalProps {
    chat: ChatViewModel;
    isOpen: boolean;
    onClose: () => void;
}

const LeaveGroupModal: React.FC<LeaveGroupModalProps> = ({ chat, isOpen, onClose }) => {
    const { leaveGroup } = useChatSettings();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) setError(null);
    }, [isOpen]);

    const close = () => {
        if (!pending) onClose();
    };

    const handleLeave = async () => {
        setPending(true);
        setError(null);

        const leaveError = await leaveGroup(chat);

        setPending(false);

        if (leaveError) {
            setError(leaveError);
            return;
        }

        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1200]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[350px] rounded-xl bg-surface px-6 py-8 text-fg shadow-lg">
                    <div className="text-center">
                        <DialogTitle className="text-lg font-semibold">Leave group</DialogTitle>
                        <p className="mt-2 text-sm text-fg-subtle">
                            You will leave {chat.groupName ?? 'this group'} on all your devices, and its messages will be deleted.
                        </p>
                    </div>

                    {error && <p className="mt-4 text-center text-sm text-danger-fg">{error}</p>}

                    <div className="mt-8 flex justify-center space-x-4">
                        <Button onClick={close} disabled={pending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleLeave} disabled={pending}>
                            {pending ? 'Leaving…' : 'Leave'}
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default LeaveGroupModal;
