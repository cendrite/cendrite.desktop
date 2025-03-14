import React from "react";
import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";

export interface SearchBarProps {
    placeHolder?: string;
    value: string;
    onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({placeHolder, value, onChange}) => (
    <div className="flex items-center px-2 mb-2 bg-darkGray-300 rounded-md">
        <MagnifyingGlassIcon className="w-4 h-4 text-white mr-2"/>
        <input
            type="text"
            placeholder={placeHolder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full py-1 text-sm bg-transparent text-white placeholder-gray-300 font-light focus:outline-none"
        />
    </div>
);

export default SearchBar;
