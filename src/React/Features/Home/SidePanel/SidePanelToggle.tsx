import React from "react";
import { ListIcon } from "@phosphor-icons/react";

interface SidePanelToggleProps {
  onClick: () => void;
}

const SidePanelToggle: React.FC<SidePanelToggleProps> = ({ onClick }) => (
  <button onClick={onClick} className="p-2 text-fg hover:bg-surface-hover rounded-md">
    <ListIcon className="w-5 h-5" />
  </button>
);

export default SidePanelToggle;
