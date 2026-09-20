import React from 'react';
import { FiSlash } from 'react-icons/fi'; // Import the new icon

interface ErrorTooltipProps {
    errorMessage: string;
}

const ErrorTooltip: React.FC<ErrorTooltipProps> = ({ errorMessage }) => {
    return (
        <div className="bg-inverted/90 border border-danger/60 text-danger-fg px-2 py-1 rounded-md flex items-center shadow-sm text-sm font-semibold">
            <FiSlash className="mr-1 text-danger-fg text-sm" /> {/* New Icon */}
            <span> {errorMessage} </span>
        </div>
    );
};

export default ErrorTooltip;
