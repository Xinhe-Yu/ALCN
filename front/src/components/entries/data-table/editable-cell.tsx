import { useState, useRef, useEffect, memo } from 'react';
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
  onStartEditing: (entryId: string, field: string, currentValue: string, translationId?: string) => void;
  onCancelEditing: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSaveEdit?: (value: string) => void;
}

const EditableCell = memo(function EditableCell({
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
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
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

  // Helper to check if field is translation-related and get translation ID
  const isTranslationField = (fieldKey: string) => {
    return fieldKey === 'first_translation' || fieldKey.startsWith('translation_');
  };

  const getTranslationId = () => {
    if (isTranslationField(column.key) && firstTranslation) {
      return firstTranslation.id;
    }
    return undefined;
  };

  // Calculate dropdown position to avoid clipping
  const calculateDropdownPosition = () => {
    if (!cellRef.current) return 'below';

    const rect = cellRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Approximate dropdown height

    // If there's enough space below, show below; otherwise show above
    if (rect.bottom + dropdownHeight > viewportHeight && rect.top > dropdownHeight) {
      return 'above';
    }
    return 'below';
  };

  // Handle dropdown selections
  const handleDropdownSelect = (value: string) => {
    // Update the edit value
    onEditValueChange(value);
    setShowDropdown(false);

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
            onClick={() => {
              if (!showDropdown) {
                setDropdownPosition(calculateDropdownPosition() as 'below' | 'above');
              }
              setShowDropdown(!showDropdown);
            }}
            className="w-full text-left px-1 py-1 text-sm border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            <Badge code={editValue || entry.language_code} />
          </button>
          {showDropdown && (
            <div className={`absolute ${dropdownPosition === 'below' ? 'top-full' : 'bottom-full'} left-0 z-[9999] w-36 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto`}>
              {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleDropdownSelect(code)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Badge code={code} />
                  <span className="text-xs">{name}</span>
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
          setTimeout(() => {
            setDropdownPosition(calculateDropdownPosition() as 'below' | 'above');
            setShowDropdown(true);
          }, 0);
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
            onClick={() => {
              if (!showDropdown) {
                setDropdownPosition(calculateDropdownPosition() as 'below' | 'above');
              }
              setShowDropdown(!showDropdown);
            }}
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
            <div className={`absolute ${dropdownPosition === 'below' ? 'top-full' : 'bottom-full'} left-0 z-[9999] w-40 bg-white border border-gray-300 rounded-md shadow-lg`}>
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
          setTimeout(() => {
            setDropdownPosition(calculateDropdownPosition() as 'below' | 'above');
            setShowDropdown(true);
          }, 0);
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
          onClick={() => onStartEditing(entry.id, column.key, currentValue, firstTranslation.id)}
          className="hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer w-full text-left"
          title="Click to edit translation"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-sm text-gray-900">{firstTranslation.translated_name}</span>
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
        onClick={() => onStartEditing(entry.id, column.key, currentValue, getTranslationId())}
        className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded text-sm transition-colors cursor-pointer min-w-0"
        title="Click to edit"
      >
        <div className={`${displayValue === '-' ? 'text-gray-400' : 'text-gray-900'}`}>
          {displayValue}
        </div>
      </button>
    );
  }

  // Read-only display
  return (
    <div className="px-2 py-1 min-w-0">
      <div className={`text-sm ${displayValue === '-' ? 'text-gray-400' : 'text-gray-900'}`}>
        {displayValue}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render if this specific cell is being edited or if the entry data changed
  const isThisCellEditing = nextProps.editingCell?.entryId === nextProps.entry.id &&
    nextProps.editingCell?.field === nextProps.column.key;
  const wasThisCellEditing = prevProps.editingCell?.entryId === prevProps.entry.id &&
    prevProps.editingCell?.field === prevProps.column.key;

  // Re-render if:
  // 1. This cell's editing state changed
  // 2. Entry data changed
  // 3. Translation data changed
  // 4. Edit value changed (but only if this cell is being edited)
  if (isThisCellEditing !== wasThisCellEditing) return false; // Re-render
  if (prevProps.entry !== nextProps.entry) return false; // Re-render
  if (prevProps.firstTranslation !== nextProps.firstTranslation) return false; // Re-render
  if (isThisCellEditing && prevProps.editValue !== nextProps.editValue) return false; // Re-render

  // Don't re-render for other editing state changes
  return true; // Skip re-render
});

export default EditableCell;
