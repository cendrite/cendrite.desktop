import React, { useState, useEffect } from "react";
import ParentPane from "./ParentPane";
import SidePanel from "./SidePanel/SidePanel";
import MainContent from "./MainContent";
import {Contact} from "../../Context/ContactContext.tsx";
import {useHomePageContext} from "../../Context/HomePage/HomePageContext.tsx";
import {HomePageContextActionType} from "../../Context/HomePage/HomePageReducer.ts";

const HomePage: React.FC = () => {
    const {selectedItem, homeDispatch} = useHomePageContext();
    const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
    const [paneType, setPaneType] = useState<"chats" | "contacts">("chats");
    const [savedContact, setSavedContact] = useState<Contact | null>(null);

    const toggleSidePanel = () => {
        setIsSidePanelVisible((prev) => !prev);
    };


    useEffect(() => {
        if (paneType === "contacts") {
            if (savedContact !== null) {
                homeDispatch({type: HomePageContextActionType.SetSelectedContact, payload: savedContact,});
            } else {
                homeDispatch({type: HomePageContextActionType.ClearSelection, payload: null,});
            }
        } else if (paneType === "chats") {
            setSavedContact(selectedItem.type === 'contact' ? selectedItem.value : null);
            homeDispatch({ type: HomePageContextActionType.ClearSelection, payload: null });
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
