import React, { useState } from 'react';
import { Contact } from '../../../Models/Contact.ts';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';
import { ChatService } from '../../../Common/Services/ChatService.ts';
import { useContacts } from '../../../Context/Contacts/ContactContext.tsx';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreated: (chat: ChatViewModel) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreated }) => {
    const { contacts } = useContacts();
    const chatService = React.useMemo(() => new ChatService(), []);

    const [name, setName] = useState('');
    const [selected, setSelected] = useState<Contact[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const toggle = (contact: Contact) =>
        setSelected((current) =>
            current.some((c) => c.id === contact.id)
                ? current.filter((c) => c.id !== contact.id)
                : [...current, contact],
        );

    const create = async () => {
        if (!name.trim() || selected.length === 0) {
            setError('A group needs a name and at least one member.');
            return;
        }

        setBusy(true);
        try {
            onCreated(await chatService.createGroup(name.trim(), selected));
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create the group.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-scrim/40 backdrop-blur-sm">
            <div className="w-96 rounded-xl bg-overlay p-4 shadow-lg ring-1 ring-line">
                <h2 className="text-fg text-sm font-medium">New group</h2>

                <input
                    className="mt-3 w-full rounded-md bg-surface px-3 py-2 text-sm text-fg outline-none"
                    placeholder="Group name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div className="mt-3 max-h-60 overflow-y-auto">
                    {contacts.map((contact) => (
                        <label
                            key={contact.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-surface-hover"
                        >
                            <input
                                type="checkbox"
                                checked={selected.some((c) => c.id === contact.id)}
                                onChange={() => toggle(contact)}
                            />
                            {contact.displayName ?? contact.username}
                        </label>
                    ))}
                </div>

                {error && <p className="mt-2 text-xs text-danger">{error}</p>}

                <div className="mt-4 flex justify-end gap-2">
                    <button className="px-3 py-1.5 text-sm text-fg-muted hover:text-fg" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="rounded-md bg-accent px-3 py-1.5 text-sm text-fg disabled:opacity-50"
                        onClick={create}
                        disabled={busy}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
