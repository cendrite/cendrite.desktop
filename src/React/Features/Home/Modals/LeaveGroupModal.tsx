import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Radio, RadioGroup } from '@headlessui/react';
import clsx from 'clsx';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { useChatSettings } from '@/React/Common/Hooks/ChatSettings.ts';
import { ChatPrivileges } from '@/Shared/Enums/ChatPrivileges';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface LeaveGroupModalProps {
    chat: ChatViewModel;
    privilege: ChatPrivileges;
    isOpen: boolean;
    onClose: () => void;
}

const LeaveGroupModal: React.FC<LeaveGroupModalProps> = ({ chat, privilege, isOpen, onClose }) => {
    const { leaveGroup } = useChatSettings();
    const [successorTag, setSuccessorTag] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const members = chat.chatMembers;
    const choosingOwner =
        privilege === ChatPrivileges.Owner &&
        members.length > 0 &&
        !members.some((member) => member.privilege === ChatPrivileges.Owner);

    useEffect(() => {
        if (!isOpen) return;
        setSuccessorTag(null);
        setError(null);
    }, [isOpen]);

    const close = () => {
        if (!pending) onClose();
    };

    const handleLeave = async () => {
        setPending(true);
        setError(null);

        const leaveError = await leaveGroup(chat, choosingOwner ? successorTag : null);

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
                <DialogPanel className="w-[380px] rounded-xl bg-surface px-6 py-8 text-fg shadow-lg">
                    <div className="text-center">
                        <DialogTitle className="text-lg font-semibold">Leave group</DialogTitle>
                        <p className="mt-2 text-sm text-fg-subtle">
                            You will leave {chat.groupName ?? 'this group'} on all your devices, and its messages will be deleted.
                        </p>
                    </div>

                    {choosingOwner && (
                        <>
                            <p className="mt-6 text-sm font-medium text-fg-muted">Choose the new owner</p>
                            <RadioGroup
                                aria-label="New owner"
                                value={successorTag}
                                onChange={setSuccessorTag}
                                className="mt-2 max-h-[260px] space-y-1 overflow-y-auto"
                            >
                                {members.map((member) => (
                                    <Radio
                                        key={member.userTag}
                                        value={member.userTag}
                                        className={({ checked }) =>
                                            clsx(
                                                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 focus:outline-none data-[focus]:ring-2 data-[focus]:ring-accent',
                                                checked ? 'bg-surface-hover' : 'hover:bg-surface-hover',
                                            )
                                        }
                                    >
                                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-media">
                                            <Avatar className="h-8 w-8" AvatarKey={member.avatar} Username={member.name} Seed={member.userTag} />
                                        </div>
                                        <span className="min-w-0 flex-1 truncate text-sm text-fg">{member.name}</span>
                                    </Radio>
                                ))}
                            </RadioGroup>
                        </>
                    )}

                    {error && <p className="mt-4 text-center text-sm text-danger-fg">{error}</p>}

                    <div className="mt-8 flex justify-center space-x-4">
                        <Button onClick={close} disabled={pending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleLeave} disabled={pending || (choosingOwner && !successorTag)}>
                            {pending ? 'Leaving…' : 'Leave'}
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default LeaveGroupModal;
