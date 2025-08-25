import React from "react";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    return (
        <div className="group relative inline-block">
            {children}
            <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-white py-1 px-2 text-xs text-black shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none z-50">
                {content}
            </div>
        </div>
    );
};

export default Tooltip;
