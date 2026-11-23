import React, { useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { ChatMemberViewModel } from '@/React/Models/ChatMemberViewModel.ts';
import { ChatService } from '@/React/Common/Services/ChatService.ts';
import { ChatPrivileges } from '@/Shared/Enums/ChatPrivileges';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface ManageMembersModalProps {
    chat: ChatViewModel;
    isOpen: boolean;
    onClose: () => void;
}

const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ chat, isOpen, onClose }) => {
    const chatService = useMemo(() => new ChatService(), []);
    const [pendingTag, setPendingTag] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const toggleAdmin = async (member: ChatMemberViewModel) => {
        const privilege = member.privilege === ChatPrivileges.Admin ? ChatPrivileges.Member : ChatPrivileges.Admin;

        setPendingTag(member.userTag);
        setError(null);

        const changeError = await chatService.changeMemberPrivilege(chat.id, member.userTag, privilege);

        setPendingTag(null);
        if (changeError) setError(changeError);
    };

    const close = () => {
        if (pendingTag !== null) return;
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1200]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[440px] rounded-xl bg-surface p-6 text-fg shadow-lg">
                    <DialogTitle className="mb-5 text-sm font-medium text-fg-muted">Manage members</DialogTitle>

                    <ul className="max-h-[420px] space-y-2 overflow-y-auto">
                        {chat.chatMembers.map((member) => (
                            <li key={member.userTag} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5">
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-fg">{member.name}</p>
                                    <p className="text-xs text-fg-subtle">
                                        {member.privilege === ChatPrivileges.Owner ? 'Owner' : member.privilege === ChatPrivileges.Admin ? 'Admin' : 'Member'}
                                    </p>
                                </div>

                                {member.privilege !== ChatPrivileges.Owner && (
                                    <Button onClick={() => toggleAdmin(member)} disabled={pendingTag !== null}>
                                        {member.privilege === ChatPrivileges.Admin ? 'Remove admin' : 'Make admin'}
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>

                    {error && <p className="mt-3 text-sm text-danger-fg">{error}</p>}

                    <div className="mt-6 flex justify-end">
                        <Button onClick={close} disabled={pendingTag !== null}>
                            Close
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default ManageMembersModal;
