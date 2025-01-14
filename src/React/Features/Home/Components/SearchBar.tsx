import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const SearchBar: React.FC = () => (
  <div className="flex items-center px-2 mb-2 bg-zinc-700 rounded-md">
    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-2" />
    <input
      type="text"
      placeholder="Search"
      className="w-full py-1 text-sm bg-transparent text-white placeholder-gray-400 focus:outline-none"
    />
  </div>
);

export default SearchBar;
