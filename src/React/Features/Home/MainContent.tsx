import ContactPage from "./Contact/ContactPage.tsx";
import React from "react";
import PendingContactPage from "./Contact/PendingContactPage.tsx";
import ChatPage from "./Chat/ChatPage.tsx";
import { useHomePage } from "../../Context/HomePage/HomePageContext.tsx";
import {HomePageActionType} from "../../Context/HomePage/HomePageReducer.ts";

const MainContent: React.FC = () => {
    const {selectedItem, homeDispatch} = useHomePage();


    let content;

    switch (selectedItem.type) {
        case 'contact':
            content = (
                <ContactPage
                    contact={selectedItem.value}
                    onClose={() =>
                        homeDispatch({ type: HomePageActionType.Clear, payload: null })
                    }
                />
            );
            break;
        case 'pending':
            content = (
                <PendingContactPage
                    pendingContact={selectedItem.value}
                    onClose={() =>
                        homeDispatch({ type: HomePageActionType.Clear, payload: null })
                    }
                />
            );
            break;
        case 'chat':
            content = (
                <ChatPage
                    chat={selectedItem.value}
                    onClose={() =>
                        homeDispatch({ type: HomePageActionType.Clear, payload: null })
                    }
                />
            );
            break;
        default:
            content = <div className="p-4" />;
    }

    return <div className="flex-1 bg-zinc-950">{content}</div>;
}

export default MainContent;
