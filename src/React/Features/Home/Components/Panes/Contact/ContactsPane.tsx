import React, {useState} from "react";
import {UserPlusIcon} from "@heroicons/react/24/outline";
import SidePanelToggle from "../../SidePanel/SidePanelToggle";
import Contact from "./Contact";
import SearchForUserModal from "../../Modals/SearchForUserModalProps.tsx";

interface ContactsPaneProps {
    isSidePanelVisible: boolean;
    toggleSidePanel: () => void;
}

export const ContactsPane: React.FC<ContactsPaneProps> = ({isSidePanelVisible, toggleSidePanel}) => {
    const [contacts] = useState(["Dave", "Eric", "John"]);
    const [isSearchUserModalOpen, setIsSearchUserModalOpen] = useState(false);

    return (
        <>
            <div className="text-white p-2 relative">
                {/* Title and Top Buttons */}
                <div className="flex items-center justify-between mb-4">
                    {/* Left Toggle Button */}
                    {!isSidePanelVisible && <SidePanelToggle onClick={toggleSidePanel}/>}

                    {/* Contacts Title */}
                    <div className="flex-grow text-center">
                        <h2 className="text-lg font-bold">Contacts</h2>
                    </div>

                    {/* Right Add Button */}
                    <button className="p-2 rounded-md text-white hover:bg-zinc-600"
                            onClick={() => setIsSearchUserModalOpen(true)}>
                        <UserPlusIcon className="w-5 h-5"/>
                    </button>
                </div>

                {/*/!* Search Bar *!/*/}
                {/*<SearchBar/>*/}

                {/* Contact List */}
                <ul className="mt-4 space-y-2">
                    {contacts.map((contact, index) => (
                        <li key={index}>
                            <Contact name={contact}/>
                        </li>
                    ))}
                </ul>
            </div>
            <SearchForUserModal isOpen={isSearchUserModalOpen} onClose={() => setIsSearchUserModalOpen(false)}/>
        </>

    );
};

export default ContactsPane;
