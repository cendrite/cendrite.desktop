import React, { ReactNode } from "react";

interface PanelButtonProps {
  onClick: () => void;
  icon: ReactNode; // Icon component (e.g., <ChatBubbleOvalLeftIcon />)
  activeIcon: ReactNode; // Filled or active icon component
  isActive: boolean;
}

const PanelButton: React.FC<PanelButtonProps> = ({ onClick, icon, activeIcon, isActive }) => (
  <button onClick={onClick} className={`p-2 rounded-md text-fg hover:bg-surface-hover ${isActive ? "bg-surface-hover" : ""}`}>
    {isActive ? activeIcon : icon}
  </button>
);

export default PanelButton;
