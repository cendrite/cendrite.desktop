import React, {useState} from "react";
import {UserPlusIcon} from "@heroicons/react/24/outline";
import SidePanelToggle from "../../SidePanel/SidePanelToggle";
import SearchForUserModal from "../../Modals/SearchForUserModal.tsx";
import ContactCard from "./ContactCard.tsx";
import {Contact, useContacts} from "./ContactContext.tsx";

interface ContactsPaneProps {
    isSidePanelVisible: boolean;
    toggleSidePanel: () => void;
}

export const ContactsPane: React.FC<ContactsPaneProps> = ({ isSidePanelVisible, toggleSidePanel }) => {
    const { contacts } = useContacts(); // ← get actual contacts from context
    const [isSearchUserModalOpen, setIsSearchUserModalOpen] = useState(false);

    return (
        <>
            <div className="text-white p-2 relative">
                {/* Title and Top Buttons */}
                <div className="flex items-center justify-between mb-4">
                    {!isSidePanelVisible && <SidePanelToggle onClick={toggleSidePanel} />}

                    <div className="flex-grow text-center">
                        <h2 className="text-lg font-bold">Contacts</h2>
                    </div>

                    <button
                        className="p-2 rounded-md text-white hover:bg-zinc-600"
                        onClick={() => setIsSearchUserModalOpen(true)}
                    >
                        <UserPlusIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Contact List */}
                <ul className="mt-4 space-y-2">
                    {contacts.map((contact: Contact) => (
                        <li key={contact.id}>
                            <ContactCard contact={contact} />
                        </li>
                    ))}
                </ul>
            </div>

            <SearchForUserModal isOpen={isSearchUserModalOpen} onClose={() => setIsSearchUserModalOpen(false)} />
        </>
    );
};

export default ContactsPane;
