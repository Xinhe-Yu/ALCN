import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AutoSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function AutoSearchBar({
  value,
  onChange,
  loading = false,
  placeholder = "Search..."
}: AutoSearchBarProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-amber-600 rounded-full"></div>
        ) : value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
