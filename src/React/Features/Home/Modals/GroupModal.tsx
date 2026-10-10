import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Contact } from '../../../Models/Contact.ts';
import { useContacts } from '../../../Context/Contacts/ContactContext.tsx';
import ContactCard from '../../../Common/Components/Cards/ContactCard.tsx';
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
                <DialogPanel className="relative w-[440px] rounded-xl bg-surface p-6 text-fg shadow-lg">
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-4 top-4 text-fg-subtle hover:text-fg-muted"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>

                    <DialogTitle className="mb-5 text-sm font-medium text-fg-muted">Create group</DialogTitle>

                    <ul className="max-h-[420px] space-y-2.5 overflow-y-auto">
                        {contacts.length === 0 && (
                            <li className="py-10 text-center text-sm text-fg-faint">No contacts to add</li>
                        )}

                        {contacts.map((c) => {
                            const selected = selectedIds.includes(c.id);
                            return (
                                <li key={c.id}>
                                    <ContactCard
                                        contact={c}
                                        variant="outlined"
                                        selected={selected}
                                        onClick={() => toggle(c.id)}
                                        trailing={
                                            <span
                                                className={clsx(
                                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                                                    selected ? 'border-accent bg-accent' : 'border-line-strong',
                                                )}
                                            >
                                                {selected && <CheckIcon className="h-3.5 w-3.5 text-fg-on-accent" />}
                                            </span>
                                        }
                                    />
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-6 flex justify-end space-x-3">
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
