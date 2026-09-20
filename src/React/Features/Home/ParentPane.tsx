import React from "react";
import ContactsPane from "./Contact/ContactsPane";
import ChatsPane from "./Chat/ChatsPane";

interface ParentPaneProps {
  paneType: "chats" | "contacts";
  isSidePanelVisible: boolean;
  toggleSidePanel: () => void;
}

export const ParentPane: React.FC<ParentPaneProps> = ({ paneType, isSidePanelVisible, toggleSidePanel }) => {
  return (
    <div className="bg-surface h-full border-r border-line transition-all duration-300 min-w-[275px]">
      {/* Render Subpane Content */}
      {paneType === "chats" ? (
        <ChatsPane isSidePanelVisible={isSidePanelVisible} toggleSidePanel={toggleSidePanel} />
      ) : (
        <ContactsPane isSidePanelVisible={isSidePanelVisible} toggleSidePanel={toggleSidePanel} />
      )}
    </div>
  );
};

export default ParentPane;
