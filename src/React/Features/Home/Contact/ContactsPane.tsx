import React, { useState } from 'react';
import SearchForUserModal from '../Modals/SearchForUserModal.tsx';
import ContactListItem from './ContactListItem.tsx';
import PendingContactListItem from './PendingContactListItem.tsx';
import NotificationBadge from '../../../Context/Notification/NotificationBadge.tsx';
import { useContacts } from '../../../Context/Contacts/ContactContext.tsx';
import { Contact } from '../../../Models/Contact.ts';
import { usePendingContacts } from '../../../Context/PendingContact/PendingContactContext.tsx';
import { BellRingingIcon, UserPlusIcon } from '@phosphor-icons/react';

export const ContactsPane: React.FC = () => {
    const { contacts } = useContacts();
    console.log(contacts.length);
    const { pendingContacts } = usePendingContacts();
    const [isSearchUserModalOpen, setIsSearchUserModalOpen] = useState(false);
    const [isRequestListSelected, setIsRequestListSelected] = useState(false);

    return (
        <>
            <div className="text-fg p-2 relative">
                {/* Title and Top Buttons */}
                <div className="relative flex items-center justify-end mb-4">
                    {/* Center title */}
                    <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold">
                        {isRequestListSelected ? 'Requests' : 'Contacts'}
                    </h2>

                    {/* Right side buttons */}
                    <div className="flex items-center">
                        <div className="relative">
                            <button
                                className={`p-2 rounded-md text-fg hover:bg-surface-hover ${isRequestListSelected ? 'bg-surface-hover' : ''
                                    }`}
                                onClick={() => setIsRequestListSelected(!isRequestListSelected)}
                            >
                                {!isRequestListSelected ? (
                                    <div>
                                        <BellRingingIcon className="w-5 h-5" />
                                        <NotificationBadge section="contacts" itemId={null} />
                                    </div>
                                ) : (
                                    <BellRingingIcon weight="fill" className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        <button
                            className="p-2 rounded-md text-fg hover:bg-surface-hover"
                            onClick={() => setIsSearchUserModalOpen(true)}
                        >
                            <UserPlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Contact List */}
                {!isRequestListSelected ? (
                    <ul className="mt-4 space-y-2">
                        {contacts.map((contact: Contact) => (
                            <li key={contact.id}>
                                <ContactListItem contact={contact} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {pendingContacts.map((contact) => (
                            <li key={contact.id}>
                                <PendingContactListItem contact={contact} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <SearchForUserModal isOpen={isSearchUserModalOpen} onClose={() => setIsSearchUserModalOpen(false)} />
        </>
    );
};

export default ContactsPane;
