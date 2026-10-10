import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Contact } from '../../../Models/Contact.ts';
import { useContacts } from '../../../Context/Contacts/ContactContext.tsx';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';
import Button from '../../../Common/Components/Button/Button.tsx';

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
}

const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, contact }) => {
    const { contacts } = useContacts();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(contact ? [contact.id] : []);
        }
    }, [isOpen, contact]);

    const toggle = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleCreateGroup = () => {
        console.log('Create group with', selectedIds);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[1010]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="relative w-[360px] rounded-xl bg-surface p-4 text-fg shadow-lg">
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-3 top-3 text-fg-subtle hover:text-fg-muted"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>

                    <DialogTitle className="mb-3 text-sm font-medium text-fg-muted">Create group</DialogTitle>

                    <ul className="max-h-[320px] space-y-1 overflow-y-auto">
                        {contacts.length === 0 && (
                            <li className="py-6 text-center text-sm text-fg-faint">No contacts to add</li>
                        )}

                        {contacts.map((c) => {
                            const selected = selectedIds.includes(c.id);
                            return (
                                <li key={c.id}>
                                    <button
                                        onClick={() => toggle(c.id)}
                                        className={clsx(
                                            'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-hover',
                                            selected && 'bg-surface-hover',
                                        )}
                                    >
                                        <Avatar
                                            className="h-8 w-8 text-xs"
                                            AvatarKey={c.avatarKey}
                                            Username={c.username}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm">{c.displayName ?? c.username}</p>
                                            {c.displayName && (
                                                <p className="truncate text-xs text-fg-subtle">{c.username}</p>
                                            )}
                                        </div>
                                        <span
                                            className={clsx(
                                                'flex h-4 w-4 items-center justify-center rounded border',
                                                selected ? 'border-accent bg-accent' : 'border-line-strong',
                                            )}
                                        >
                                            {selected && <CheckIcon className="h-3 w-3 text-fg-on-accent" />}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-4 flex justify-end space-x-2">
                        <Button onClick={onClose}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateGroup} disabled={selectedIds.length === 0}>
                            Create
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default GroupModal;
