import React, {useState} from "react";
import ParentPane from "./ParentPane";
import SidePanel from "./SidePanel/SidePanel";

const HomePage: React.FC = () => {
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
  const [paneType, setPaneType] = useState<"chats" | "contacts">("chats");

  return (
    <div className="flex h-screen w-screen bg-zinc-900">
      {/* SidePanel - conditional rendering */}
      {isSidePanelVisible && (
        <div className="w-16 bg-darkGray-500">
          <SidePanel onHide={() => setIsSidePanelVisible(false)} setPaneType={setPaneType} paneType={paneType} />
        </div>
      )}

      {/* MidPane (ParentPane) with dynamic width */}
      <ParentPane
        paneType={paneType}
        isSidePanelVisible={isSidePanelVisible}
        toggleSidePanel={() => setIsSidePanelVisible(!isSidePanelVisible)}
      />

      {/* Main content (ChatWindow) */}
        <div className="flex-1 bg-zinc-950">

        </div>
    </div>
  );
};

export default HomePage;
