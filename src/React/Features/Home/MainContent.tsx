import ContactPage from "./Contact/ContactPage.tsx";
import React from "react";
import {useHomePageContext} from "../../Context/HomePageContext.tsx";
import PendingContactPage from "./Contact/PendingContactPage.tsx";
import ChatPage from "./Chat/ChatPage.tsx";

const MainContent: React.FC = () => {
    const {
        selectedChatId,
        setSelectedChatId,
        selectedContact,
        selectedPendingContact,
        setSelectedPendingContact,
        setSelectedContact
    } = useHomePageContext();


    return (
        <div className="flex-1 bg-zinc-950">
            {selectedContact ? (
                <ContactPage
                    contact={selectedContact}
                    onClose={() => setSelectedContact(null)}/>
            ) : selectedPendingContact ? (
                <PendingContactPage
                    pendingContact={selectedPendingContact}
                    onClose={() => setSelectedPendingContact(null)}/>
            ) : selectedChatId ? (
                <ChatPage
                    chatId={selectedChatId}
                    onClose={() => setSelectedChatId(null)}/>
            ) : (
                <div className="p-4"/>
            )}
        </div>
    );
}

export default MainContent;