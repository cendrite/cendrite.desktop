import React, { useState, useEffect } from 'react';
import ParentPane from './ParentPane';
import SidePanel from './SidePanel/SidePanel';
import MainContent from './MainContent';
import { useHomePage } from '../../Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '../../Context/HomePage/HomePageReducer.ts';
import { Contact } from '../../Models/Contact.ts';

const HomePage: React.FC = () => {
    const { selectedItem, homeDispatch } = useHomePage();
    const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
    const [paneType, setPaneType] = useState<'chats' | 'contacts'>('chats');
    const [savedContact, setSavedContact] = useState<Contact | null>(null);

    const toggleSidePanel = () => {
        setIsSidePanelVisible((prev) => !prev);
    };

    useEffect(() => {
        if (paneType === 'contacts') {
            if (savedContact !== null) {
                homeDispatch({ type: HomePageActionType.SetSelectedContact, payload: savedContact });
            } else {
                homeDispatch({ type: HomePageActionType.Clear });
            }
        } else if (paneType === 'chats') {
            setSavedContact(selectedItem.type === 'contact' ? selectedItem.value : null);
            homeDispatch({ type: HomePageActionType.Clear });
        }
    }, [paneType]);

    return (
        <div className="flex h-screen w-scree bg-canvas overflow-x-hidden">
            {isSidePanelVisible && (
                <div className="w-16 bg-surface">
                    <SidePanel
                        onHide={() => setIsSidePanelVisible(false)}
                        paneType={paneType}
                        setPaneType={setPaneType}
                    />
                </div>
            )}

            <ParentPane paneType={paneType} isSidePanelVisible={isSidePanelVisible} toggleSidePanel={toggleSidePanel} />

            <div className="flex-1 bg-canvas relative">
                <MainContent />
            </div>
        </div>
    );
};

export default HomePage;
