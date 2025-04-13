import React, {useContext} from "react";
import { HomePageContext } from "../../Context/HomePageContext";
import ContactPage from "./Contact/ContactPage.tsx";

const MainContent: React.FC = () => {
    const context = useContext(HomePageContext);
    if (!context) {
        throw new Error("MainContent must be used within a HomePageProvider");
    }
    const {selectedContact} = context;

    return (
        <div className="flex-1 bg-zinc-950">
            {selectedContact ? (
              <ContactPage
                contact={selectedContact}
                onClose={() => context.setSelectedContact(null)}/>
            ) : (
                <div className="p-4"/>
            )}
        </div>
    );
}

export default MainContent;