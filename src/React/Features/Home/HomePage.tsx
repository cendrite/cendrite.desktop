import React, { useState, useEffect } from 'react';
import ParentPane from './ParentPane';
import SidePanel from './SidePanel/SidePanel';
import MainContent from './MainContent';
import { useHomePage } from '@/React/Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '@/React/Context/HomePage/HomePageReducer.ts';
import { Contact } from '@/React/Models/Contact.ts';
import { useDeviceRevocation } from '@/React/Common/Hooks/DeviceRevocation';

const HomePage: React.FC = () => {
    const { selectedItem, homeDispatch } = useHomePage();
    const [isPaneVisible, setIsPaneVisible] = useState(true);
    const [paneType, setPaneType] = useState<'chats' | 'contacts'>('chats');
    const [savedContact, setSavedContact] = useState<Contact | null>(null);

    useDeviceRevocation();

    const togglePane = () => {
        setIsPaneVisible((prev) => !prev);
    };

    const selectPane = (type: 'chats' | 'contacts') => {
        setPaneType(type);
        setIsPaneVisible(true);
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
            <SidePanel onTogglePane={togglePane} paneType={paneType} setPaneType={selectPane} />

            {isPaneVisible && <ParentPane paneType={paneType} />}

            <div className="flex-1 bg-canvas relative">
                <MainContent />
            </div>
        </div>
    );
};

export default HomePage;
