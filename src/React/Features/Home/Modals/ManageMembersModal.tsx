import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Radio, RadioGroup } from '@headlessui/react';
import { TrashIcon, XIcon } from '@phosphor-icons/react';
import clsx from 'clsx';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { ChatMemberViewModel } from '@/React/Models/ChatMemberViewModel.ts';
import { ChatService } from '@/React/Common/Services/ChatService.ts';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { ChatPrivileges } from '@/Shared/Enums/ChatPrivileges';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface ManageMembersModalProps {
    chat: ChatViewModel;
    privilege: ChatPrivileges;
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

const roleLabel = (privilege: ChatPrivileges) =>
    privilege === ChatPrivileges.Owner ? 'Owner' : privilege === ChatPrivileges.Admin ? 'Admin' : 'Member';

const MemberRow: React.FC<MemberRowProps> = ({ name, avatarKey, seed, children }) => (
    <li className="flex min-h-[60px] items-center gap-3 py-2.5">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-media">
            <Avatar className="h-10 w-10" AvatarKey={avatarKey} Username={name} Seed={seed} />
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{name}</p>
        {children}
    </li>
);

const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ chat, privilege, isOpen, onClose }) => {
    const { user } = useUser();
    const chatService = useMemo(() => new ChatService(), []);
    const [changedRoles, setChangedRoles] = useState<Record<string, ChatPrivileges>>({});
    const [removedTags, setRemovedTags] = useState<string[]>([]);
    const [confirmingTag, setConfirmingTag] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setChangedRoles((current) =>
            Object.fromEntries(
                Object.entries(current).filter(
                    ([userTag, role]) => chat.chatMembers.find((member) => member.userTag === userTag)?.privilege !== role,
                ),
            ),
        );
        setRemovedTags((current) => current.filter((userTag) => chat.chatMembers.some((member) => member.userTag === userTag)));
    }, [chat.chatMembers]);

    const roleOf = (member: ChatMemberViewModel) => changedRoles[member.userTag] ?? member.privilege;

    const changeRole = async (member: ChatMemberViewModel, role: ChatPrivileges) => {
        const previous = roleOf(member);
        if (previous === role) return;

        setError(null);
        setChangedRoles((current) => ({ ...current, [member.userTag]: role }));

        const changeError = await chatService.changeMemberPrivilege(chat.id, member.userTag, role);
        if (!changeError) return;

        setChangedRoles((current) => ({ ...current, [member.userTag]: previous }));
        setError(changeError);
    };

    const removeMember = async (member: ChatMemberViewModel) => {
        setError(null);
        setConfirmingTag(null);
        setRemovedTags((current) => [...current, member.userTag]);

        const removeError = await chatService.removeGroupMember(chat.id, member.userTag);
        if (!removeError) return;

        setRemovedTags((current) => current.filter((userTag) => userTag !== member.userTag));
        setError(removeError);
    };

    const close = () => {
        setChangedRoles({});
        setRemovedTags([]);
        setConfirmingTag(null);
        setError(null);
        onClose();
    };

    const ownName = user?.displayName ?? user?.username ?? 'You';
    const members = chat.chatMembers.filter((member) => !removedTags.includes(member.userTag));

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1200]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative w-[460px] rounded-xl bg-surface p-6 text-fg shadow-lg">
                    <button
                        onClick={close}
                        aria-label="Close"
                        className="absolute right-4 top-4 rounded-md p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg-muted"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>

                    <DialogTitle className="text-sm font-medium text-fg">Manage members</DialogTitle>
                    <p className="mt-1 text-xs text-fg-subtle">Admins can add and remove members and rename the group.</p>

                    <ul className="mt-4 max-h-[420px] divide-y divide-line overflow-y-auto">
                        <MemberRow name={`${ownName} (you)`} avatarKey={user?.avatarKey ?? null} seed={user?.userTag ?? ownName}>
                            <span className="px-3 text-xs font-medium text-fg-subtle">{roleLabel(privilege)}</span>
                        </MemberRow>

                        {members.map((member) => (
                            <MemberRow key={member.userTag} name={member.name} avatarKey={member.avatar} seed={member.userTag}>
                                {confirmingTag === member.userTag ? (
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Button onClick={() => setConfirmingTag(null)}>Cancel</Button>
                                        <Button variant="danger" onClick={() => removeMember(member)}>
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {privilege === ChatPrivileges.Owner && member.privilege !== ChatPrivileges.Owner ? (
                                            <RadioGroup
                                                aria-label={`Role of ${member.name}`}
                                                value={roleOf(member)}
                                                onChange={(role) => changeRole(member, role)}
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
                                        ) : (
                                            <span className="px-3 text-xs font-medium text-fg-subtle">{roleLabel(member.privilege)}</span>
                                        )}

                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                                            {privilege > member.privilege && (
                                                <button
                                                    onClick={() => setConfirmingTag(member.userTag)}
                                                    aria-label={`Remove ${member.name}`}
                                                    className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-danger/20 hover:text-danger-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </>
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
