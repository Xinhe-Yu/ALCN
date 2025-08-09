import { useState, useRef, useEffect } from 'react';
import { EntryWithTranslations, Translation } from '@/app/types';
import { LANGUAGE_OPTIONS, ENTRY_TYPE_OPTIONS } from '@/app/types';
import Badge from '../../ui/badge';
import { ColumnConfig, EDITABLE_FIELDS, ENTRY_TYPE_COLORS } from './column-config';
import { EditingCell } from './use-inline-editing';

interface EditableCellProps {
  entry: EntryWithTranslations;
  firstTranslation: Translation | undefined;
  column: ColumnConfig;
  editingCell: EditingCell | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (entryId: string, field: string, currentValue: string) => void;
  onCancelEditing: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSaveEdit?: (value: string) => void;
}

export default function EditableCell({
  entry,
  firstTranslation,
  column,
  editingCell,
  editValue,
  onEditValueChange,
  onStartEditing,
  onCancelEditing,
  onKeyPress,
  onSaveEdit
}: EditableCellProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const isEditing = editingCell?.entryId === entry.id && editingCell?.field === column.key;

  const getValue = () => {
    switch (column.key) {
      case 'primary_name':
        return entry.primary_name;
      case 'original_script':
        return entry.original_script || '';
      case 'language_code':
        return entry.language_code;
      case 'entry_type':
        return entry.entry_type || '';
      case 'alternative_names':
        return entry.alternative_names?.join(', ') || '';
      case 'etymology':
        return entry.etymology || '';
      case 'definition':
        return entry.definition || '';
      case 'historical_context':
        return entry.historical_context || '';
      case 'is_verified':
        return entry.is_verified ? 'Yes' : 'No';
      case 'verification_notes':
        return entry.verification_notes || '';
      case 'first_translation':
        return firstTranslation?.translated_name || '';
      case 'translation_language':
        return firstTranslation?.language_code || '';
      case 'translation_notes':
        return firstTranslation?.notes || '';
      case 'translation_votes':
        if (!firstTranslation || (firstTranslation.upvotes === 0 && firstTranslation.downvotes === 0)) {
          return '';
        }
        return `↑${firstTranslation.upvotes} ↓${firstTranslation.downvotes}`;
      case 'created_at':
        return new Date(entry.created_at).toLocaleDateString();
      case 'updated_at':
        return new Date(entry.updated_at).toLocaleDateString();
      default:
        return '';
    }
  };

  const currentValue = getValue();
  const displayValue = currentValue || '-';
  const isEditable = EDITABLE_FIELDS.includes(column.key);

  // Handle dropdown selections
  const handleDropdownSelect = (value: string) => {
    console.log('Dropdown selected:', value);

    // Update the edit value
    onEditValueChange(value);
    setShowDropdown(false);

    // Directly save with the new value instead of relying on state updates
    setTimeout(() => {
      console.log('About to save dropdown selection:', value);
      console.log('onSaveEdit available:', typeof onSaveEdit);

      if (typeof onSaveEdit === 'function') {
        console.log('Calling onSaveEdit with:', value);
        onSaveEdit(value);
      } else {
        console.log('onSaveEdit not available, using keyboard event fallback');
        // Fallback to keyboard event
        const event = {
          key: 'Enter',
          preventDefault: () => { },
          stopPropagation: () => { }
        } as React.KeyboardEvent;
        onKeyPress(event);
      }
    }, 10);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Render language badge with dropdown
  if (column.key === 'language_code') {
    if (isEditing) {
      return (
        <div ref={cellRef} className="relative min-w-0">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full text-left px-1 py-1 text-sm border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            <Badge code={editValue || entry.language_code} />
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 z-50 w-36 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleDropdownSelect(code)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Badge code={code} />
                  <span className="text-xs truncate">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          onStartEditing(entry.id, column.key, currentValue);
          // Show dropdown immediately when editing starts
          setTimeout(() => setShowDropdown(true), 0);
        }}
        className="hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer"
        title="Click to edit language"
      >
        <Badge code={entry.language_code} />
      </button>
    );
  }

  // Render entry type badge with dropdown
  if (column.key === 'entry_type') {
    const typeColors = ENTRY_TYPE_COLORS[entry.entry_type || ''] || ENTRY_TYPE_COLORS[''];

    if (isEditing) {
      return (
        <div ref={cellRef} className="relative min-w-0">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full text-left px-1 py-1 text-sm border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            {editValue ? (
              <span className={`px-2 py-1 rounded-md text-xs font-medium border ${ENTRY_TYPE_COLORS[editValue] || ENTRY_TYPE_COLORS['']}`}>
                {ENTRY_TYPE_OPTIONS[editValue as keyof typeof ENTRY_TYPE_OPTIONS] || editValue}
              </span>
            ) : (
              <span className="text-gray-400 text-xs">Select type...</span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 z-50 w-40 bg-white border border-gray-300 rounded-md shadow-lg">
              <button
                onClick={() => handleDropdownSelect('')}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100"
              >
                <span className="text-gray-400 text-xs">No type</span>
              </button>
              {Object.entries(ENTRY_TYPE_OPTIONS).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleDropdownSelect(code)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100"
                >
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${ENTRY_TYPE_COLORS[code] || ENTRY_TYPE_COLORS['']}`}>
                    {name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          onStartEditing(entry.id, column.key, currentValue);
          // Show dropdown immediately when editing starts
          setTimeout(() => setShowDropdown(true), 0);
        }}
        className="hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer"
        title="Click to edit type"
      >
        {entry.entry_type ? (
          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${typeColors}`}>
            {ENTRY_TYPE_OPTIONS[entry.entry_type as keyof typeof ENTRY_TYPE_OPTIONS] || entry.entry_type}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </button>
    );
  }

  // Render translation with language badge
  if (column.key === 'first_translation') {
    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onKeyPress}
          onBlur={onCancelEditing}
          className="w-full min-w-0 px-2 py-1 text-sm border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          placeholder="Translation name..."
          autoFocus
        />
      );
    }

    if (firstTranslation) {
      return (
        <button
          onClick={() => onStartEditing(entry.id, column.key, currentValue)}
          className="hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer w-full text-left"
          title="Click to edit translation"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-sm text-gray-900 truncate">{firstTranslation.translated_name}</span>
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={() => onStartEditing(entry.id, column.key, '')}
        className="hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer text-gray-400 text-sm w-full text-left"
        title="Click to add translation"
      >
        No translation
      </button>
    );
  }

  // Render votes (read-only)
  if (column.key === 'translation_votes' && firstTranslation && (firstTranslation.upvotes > 0 || firstTranslation.downvotes > 0)) {
    return (
      <div className="flex items-center text-xs space-x-1">
        {firstTranslation.upvotes > 0 && (
          <span className="text-green-600">↑{firstTranslation.upvotes}</span>
        )}
        {firstTranslation.downvotes > 0 && (
          <span className="text-red-600">↓{firstTranslation.downvotes}</span>
        )}
      </div>
    );
  }

  // Render verification status
  if (column.key === 'is_verified') {
    return (
      <span className={entry.is_verified ? 'text-green-600' : 'text-gray-400'}>
        {entry.is_verified ? '✓' : '✗'}
      </span>
    );
  }

  // Regular text editing
  if (isEditing && isEditable) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onKeyDown={onKeyPress}
        onBlur={onCancelEditing}
        className="w-full min-w-0 px-2 py-1 text-sm border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
        autoFocus
      />
    );
  }

  // Default display with click-to-edit for editable fields
  if (isEditable) {
    return (
      <button
        onClick={() => onStartEditing(entry.id, column.key, currentValue)}
        className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded text-sm transition-colors cursor-pointer min-w-0"
        title="Click to edit"
      >
        <span className={displayValue === '-' ? 'text-gray-400' : 'text-gray-900'}>
          {displayValue}
        </span>
      </button>
    );
  }

  // Read-only display
  return (
    <div className="text-sm text-gray-900 px-2 py-1 min-w-0">
      <span className={displayValue === '-' ? 'text-gray-400' : ''}>
        {displayValue}
      </span>
    </div>
  );
}
