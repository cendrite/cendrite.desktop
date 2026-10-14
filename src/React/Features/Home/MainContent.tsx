import ContactPage from './Contact/ContactPage.tsx';
import React from 'react';
import PendingContactPage from './Contact/PendingContactPage.tsx';
import ChatPage from './Chat/ChatPage.tsx';
import { useHomePage } from '@/React/Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '@/React/Context/HomePage/HomePageReducer.ts';

const MainContent: React.FC = () => {
    const { selectedItem, homeDispatch } = useHomePage();

    let content;

    switch (selectedItem.type) {
        case 'contact':
            content = (
                <ContactPage
                    contact={selectedItem.value}
                    onClose={() => homeDispatch({ type: HomePageActionType.Clear })}
                />
            );
            break;
        case 'pending':
            content = (
                <PendingContactPage
                    pendingContact={selectedItem.value}
                    onClose={() => homeDispatch({ type: HomePageActionType.Clear })}
                />
            );
            break;
        case 'chat':
            content = (
                <ChatPage
                    chatId={selectedItem.value.id}
                    onClose={() => homeDispatch({ type: HomePageActionType.Clear })}
                />
            );
            break;
        default:
            content = <div className="p-4" />;
    }

    return <div className="flex-1 bg-canvas">{content}</div>;
};

export default MainContent;
