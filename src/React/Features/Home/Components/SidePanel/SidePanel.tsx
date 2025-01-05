import React from "react";
import { UserIcon, Cog6ToothIcon, ChatBubbleOvalLeftIcon, UserGroupIcon } from "@heroicons/react/24/outline";

import {
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconFilled,
  UserGroupIcon as UserGroupIconFilled,
} from "@heroicons/react/24/solid";
import SidePanelToggle from "./SidePanelToggle";
import PanelButton from "./SidePanelButton";

export interface SidePanelProps {
  onHide: () => void;
  setPaneType: (type: "chats" | "contacts") => void;
  paneType: "chats" | "contacts";
}

export const SidePanel: React.FC<SidePanelProps> = ({ onHide, setPaneType, paneType }) => {
  return (
    <div className="bg-zinc-800 text-white w-[60px] h-screen flex flex-col justify-between py-2 border-r border-zinc-600">
      {/* Top Icons: SidePanelToggle, Chat, Contacts */}
      <div className="flex flex-col items-center space-y-4">
        {/* SidePanelToggle */}
        <SidePanelToggle onClick={onHide} />

        {/* Chat button */}
        <PanelButton
          onClick={() => setPaneType("chats")}
          icon={<ChatBubbleOvalLeftIcon className="w-5 h-5 cursor-pointer hover:text-gray-300" />}
          activeIcon={<ChatBubbleOvalLeftIconFilled className="w-5 h-5 cursor-pointer text-gray-300" />}
          isActive={paneType === "chats"}
        />

        {/* Contacts button */}
        <PanelButton
          onClick={() => setPaneType("contacts")}
          icon={<UserGroupIcon className="w-5 h-5" />}
          activeIcon={<UserGroupIconFilled className="w-5 h-5 text-gray-300" />}
          isActive={paneType === "contacts"}
        />
      </div>

      {/* Bottom Icons: User Profile and Settings */}
      <div className="flex flex-col items-center space-y-8">
        <UserIcon className="w-6 h-6 cursor-pointer hover:text-gray-300" />
        <Cog6ToothIcon className="w-6 h-6 cursor-pointer hover:text-gray-300" />
      </div>
    </div>
  );
};

export default SidePanel;
