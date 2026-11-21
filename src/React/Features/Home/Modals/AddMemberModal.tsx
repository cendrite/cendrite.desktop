import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Contact } from '@/React/Models/Contact.ts';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { useContacts } from '@/React/Context/Contacts/ContactContext.tsx';
import { ChatService } from '@/React/Common/Services/ChatService.ts';
import ContactCard from '@/React/Common/Components/Cards/ContactCard.tsx';
import Button from '@/React/Common/Components/Button/Button.tsx';

interface AddMemberModalProps {
    chat: ChatViewModel;
    isOpen: boolean;
    onClose: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ chat, isOpen, onClose }) => {
    const { contacts } = useContacts();
    const chatService = useMemo(() => new ChatService(), []);
    const [selected, setSelected] = useState<Contact | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const candidates = useMemo(
        () => contacts.filter((contact) => !chat.chatMembers.some((member) => member.userTag === contact.id)),
        [contacts, chat.chatMembers],
    );

    useEffect(() => {
        if (!isOpen) return;
        setSelected(null);
        setError(null);
    }, [isOpen]);

    const close = () => {
        if (!pending) onClose();
    };

    const handleAdd = async () => {
        if (!selected) return;

        setPending(true);
        setError(null);

        const addError = await chatService.addGroupMember(chat.id, selected.id);

        setPending(false);

        if (addError) {
            setError(addError);
            return;
        }

        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-[1200]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-[440px] rounded-xl bg-surface p-6 text-fg shadow-lg">
                    <DialogTitle className="mb-5 text-sm font-medium text-fg-muted">Add member</DialogTitle>

                    <ul className="max-h-[420px] space-y-2.5 overflow-y-auto">
                        {candidates.length === 0 && (
                            <li className="py-10 text-center text-sm text-fg-faint">No contacts to add</li>
                        )}

                        {candidates.map((contact) => (
                            <li key={contact.id}>
                                <ContactCard
                                    contact={contact}
                                    variant="outlined"
                                    selected={selected?.id === contact.id}
                                    onClick={() => setSelected(contact)}
                                />
                            </li>
                        ))}
                    </ul>

                    {error && <p className="mt-3 text-sm text-danger-fg">{error}</p>}

                    <div className="mt-6 flex justify-end space-x-3">
                        <Button onClick={close} disabled={pending}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAdd} disabled={!selected || pending}>
                            {pending ? 'Adding…' : 'Add'}
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default AddMemberModal;
