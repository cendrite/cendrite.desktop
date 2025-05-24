import React, {useState} from "react";
import {BellAlertIcon, UserPlusIcon} from "@heroicons/react/24/outline";
import {BellAlertIcon as BellAlertIconFilled} from "@heroicons/react/24/solid";
import SidePanelToggle from "../SidePanel/SidePanelToggle";
import SearchForUserModal from "../Modals/SearchForUserModal.tsx";
import ContactCard from "./ContactCard.tsx";
import {Contact, useContacts} from "../../../Context/ContactContext.tsx";
import {usePendingContacts} from "../../../Context/PendingContactContext.tsx";
import PendingContactCard from "./PendingContactCard.tsx";
import NotificationBadge from "../../../Context/Notification/NotificationBadge.tsx";

interface ContactsPaneProps {
    isSidePanelVisible: boolean;
    toggleSidePanel: () => void;
}

export const ContactsPane: React.FC<ContactsPaneProps> = ({isSidePanelVisible, toggleSidePanel}) => {
    const {contacts} = useContacts();
    const {pendingContacts} = usePendingContacts();
    const [isSearchUserModalOpen, setIsSearchUserModalOpen] = useState(false);
    const [isRequestListSelected, setIsRequestListSelected] = useState(false);

    return (
        <>
            <div className="text-white p-2 relative">
                {/* Title and Top Buttons */}
                <div className="relative flex items-center justify-between mb-4">
                    {/* Left side (optional toggle) */}
                    <div className="flex items-center mr-6">
                        {!isSidePanelVisible && <SidePanelToggle onClick={toggleSidePanel}/>}
                    </div>

                    {/* Center title */}
                    <h2 className="absolute left-1/2 transform -translate-x-12 text-lg font-bold">
                        {isRequestListSelected ? "Requests" : "Contacts"}
                    </h2>

                    {/* Right side buttons */}
                    <div className="flex items-center">
                        <div className="relative">
                            <button
                                className={`p-2 rounded-md text-white hover:bg-darkGray-300 ${
                                    isRequestListSelected ? "bg-darkGray-300" : ""
                                }`}
                                onClick={() => setIsRequestListSelected(!isRequestListSelected)}
                            >
                                {!isRequestListSelected ? (
                                    <div>
                                        <BellAlertIcon className="w-5 h-5"/>
                                        <NotificationBadge section="contacts" itemId={null}/>
                                    </div>
                                ) : (
                                    <BellAlertIconFilled className="w-5 h-5"/>
                                )}
                            </button>
                        </div>

                        <button
                            className="p-2 rounded-md text-white hover:bg-darkGray-300"
                            onClick={() => setIsSearchUserModalOpen(true)}
                        >
                            <UserPlusIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Contact List */}
                {!isRequestListSelected ? (
                    <ul className="mt-4 space-y-2">
                        {contacts.map((contact: Contact) => (
                            <li key={contact.id}>
                                <ContactCard contact={contact}/>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {pendingContacts.map((contact) => (
                            <li key={contact.id}>
                                <PendingContactCard contact={contact}/>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <SearchForUserModal isOpen={isSearchUserModalOpen} onClose={() => setIsSearchUserModalOpen(false)}/>
        </>
    );
};

export default ContactsPane;
