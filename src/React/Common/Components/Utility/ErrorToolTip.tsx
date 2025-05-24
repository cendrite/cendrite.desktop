import React from "react";
import { FiSlash } from "react-icons/fi"; // Import the new icon

interface ErrorTooltipProps {
  errorMessage: string;
}

const ErrorTooltip: React.FC<ErrorTooltipProps> = ({ errorMessage }) => {
  return (
    <div className="bg-white bg-opacity-90 border border-red-500 border-opacity-60 text-red-500 px-2 py-1 rounded-md flex items-center shadow-sm text-sm font-semibold">
      <FiSlash className="mr-1 text-red-500 text-sm" /> {/* New Icon */}
      <span> {errorMessage} </span>
    </div>
  );
};

export default ErrorTooltip;
