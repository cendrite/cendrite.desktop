import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Radio, RadioGroup } from '@headlessui/react';
import { XIcon } from '@phosphor-icons/react';
import clsx from 'clsx';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { ChatMemberViewModel } from '@/React/Models/ChatMemberViewModel.ts';
import { ChatService } from '@/React/Common/Services/ChatService.ts';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { ChatPrivileges } from '@/Shared/Enums/ChatPrivileges';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';

interface ManageMembersModalProps {
    chat: ChatViewModel;
    isOpen: boolean;
    onClose: () => void;
}

interface MemberRowProps {
    name: string;
    avatarKey: string | null;
    seed: string;
    children: React.ReactNode;
}

const ROLES = [
    { value: ChatPrivileges.Member, label: 'Member' },
    { value: ChatPrivileges.Admin, label: 'Admin' },
];

const MemberRow: React.FC<MemberRowProps> = ({ name, avatarKey, seed, children }) => (
    <li className="flex items-center gap-3 py-2.5">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-media">
            <Avatar className="h-10 w-10" AvatarKey={avatarKey} Username={name} Seed={seed} />
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{name}</p>
        {children}
    </li>
);

const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ chat, isOpen, onClose }) => {
    const { user } = useUser();
    const chatService = useMemo(() => new ChatService(), []);
    const [changedRoles, setChangedRoles] = useState<Record<string, ChatPrivileges>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setChangedRoles((current) =>
            Object.fromEntries(
                Object.entries(current).filter(
                    ([userTag, privilege]) => chat.chatMembers.find((member) => member.userTag === userTag)?.privilege !== privilege,
                ),
            ),
        );
    }, [chat.chatMembers]);

    const roleOf = (member: ChatMemberViewModel) => changedRoles[member.userTag] ?? member.privilege;

    const changeRole = async (member: ChatMemberViewModel, privilege: ChatPrivileges) => {
        const previous = roleOf(member);
        if (previous === privilege) return;

        setError(null);
        setChangedRoles((current) => ({ ...current, [member.userTag]: privilege }));

        const changeError = await chatService.changeMemberPrivilege(chat.id, member.userTag, privilege);
        if (!changeError) return;

        setChangedRoles((current) => ({ ...current, [member.userTag]: previous }));
        setError(changeError);
    };

    const close = () => {
        setChangedRoles({});
        setError(null);
        onClose();
    };

    const ownName = user?.displayName ?? user?.username ?? 'You';

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1200]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative w-[420px] rounded-xl bg-surface p-6 text-fg shadow-lg">
                    <button
                        onClick={close}
                        aria-label="Close"
                        className="absolute right-4 top-4 rounded-md p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg-muted"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>

                    <DialogTitle className="text-sm font-medium text-fg">Manage members</DialogTitle>
                    <p className="mt-1 text-xs text-fg-subtle">Admins can add people and rename the group.</p>

                    <ul className="mt-4 max-h-[420px] divide-y divide-line overflow-y-auto">
                        <MemberRow name={`${ownName} (you)`} avatarKey={user?.avatarKey ?? null} seed={user?.userTag ?? ownName}>
                            <span className="px-3 text-xs font-medium text-fg-subtle">Owner</span>
                        </MemberRow>

                        {chat.chatMembers.map((member) => (
                            <MemberRow key={member.userTag} name={member.name} avatarKey={member.avatar} seed={member.userTag}>
                                {member.privilege === ChatPrivileges.Owner ? (
                                    <span className="px-3 text-xs font-medium text-fg-subtle">Owner</span>
                                ) : (
                                    <RadioGroup
                                        aria-label={`Role of ${member.name}`}
                                        value={roleOf(member)}
                                        onChange={(privilege) => changeRole(member, privilege)}
                                        className="flex shrink-0 rounded-lg bg-canvas p-0.5"
                                    >
                                        {ROLES.map((role) => (
                                            <Radio
                                                key={role.value}
                                                value={role.value}
                                                className={({ checked }) =>
                                                    clsx(
                                                        'w-16 cursor-pointer rounded-md py-1 text-center text-xs font-medium transition-colors focus:outline-none data-[focus]:ring-2 data-[focus]:ring-accent',
                                                        checked ? 'bg-overlay text-fg shadow-sm' : 'text-fg-subtle hover:text-fg-muted',
                                                    )
                                                }
                                            >
                                                {role.label}
                                            </Radio>
                                        ))}
                                    </RadioGroup>
                                )}
                            </MemberRow>
                        ))}
                    </ul>

                    {error && <p className="mt-3 text-sm text-danger-fg">{error}</p>}
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default ManageMembersModal;
