import React, { useState, useEffect, useContext } from "react";
import ParentPane from "./ParentPane";
import SidePanel from "./SidePanel/SidePanel";
import MainContent from "./MainContent";
import { HomePageContext } from "../../Context/HomePageContext";
import {Contact} from "../../Context/ContactContext.tsx";

const HomePage: React.FC = () => {
    const { selectedContact, setSelectedContact } = useContext(HomePageContext)!;
    const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
    const [paneType, setPaneType] = useState<"chats" | "contacts">("chats");
    const [savedContact, setSavedContact] = useState<Contact | null>(null);

    const toggleSidePanel = () => {
        setIsSidePanelVisible((prev) => !prev);
    };


    useEffect(() => {
        if (paneType === "contacts") {
            setSelectedContact(savedContact);
        } else if (paneType === "chats") {
            setSavedContact(selectedContact);
            setSelectedContact(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paneType]);

    return (
        <div className="flex h-screen w-scree bg-zinc-900 overflow-x-hidden">

            {isSidePanelVisible && (
                <div className="w-16 bg-darkGray-500">
                    <SidePanel
                        onHide={() => setIsSidePanelVisible(false)}
                        paneType={paneType}
                        setPaneType={setPaneType}
                    />
                </div>
            )}

            <ParentPane
                paneType={paneType}
                isSidePanelVisible={isSidePanelVisible}
                toggleSidePanel={toggleSidePanel}
            />

            <div className="flex-1 bg-zinc-950 relative">
                <MainContent />
            </div>
        </div>
    );
};

export default HomePage;
