import { useState } from "react";
import ParentPane from "./Components/Panes/ParentPane";
import SidePanel from "./Components/SidePanel/SidePanel";

const HomePage: React.FC = () => {
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
  const [paneType, setPaneType] = useState<"chats" | "contacts">("chats");

  return (
    <div className="flex h-screen w-screen bg-zinc-900">
      {/* SidePanel - conditional rendering */}
      {isSidePanelVisible && (
        <div className="w-16 bg-zinc-800">
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
    </div>
  );
};

export default HomePage;
