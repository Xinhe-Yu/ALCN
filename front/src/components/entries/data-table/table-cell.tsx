import { EntryWithTranslations, Translation } from '@/app/types';
import Badge from '../../ui/badge';
import { ColumnConfig, EDITABLE_FIELDS } from './column-config';
import { EditingCell } from './use-inline-editing';

interface TableCellProps {
  entry: EntryWithTranslations;
  firstTranslation: Translation | undefined;
  column: ColumnConfig;
  editingCell: EditingCell | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (entryId: string, field: string, currentValue: string) => void;
  onCancelEditing: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function TableCell({
  entry,
  firstTranslation,
  column,
  editingCell,
  editValue,
  onEditValueChange,
  onStartEditing,
  onCancelEditing,
  onKeyPress
}: TableCellProps) {
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
        return firstTranslation?.translated_name || 'No translation';
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

  // Special rendering for certain column types
  if (column.key === 'language_code' && !isEditing) {
    return <Badge code={entry.language_code} />;
  }

  if (column.key === 'entry_type' && !isEditing) {
    return entry.entry_type ? <Badge code={entry.entry_type} type="type" /> : <span className="text-gray-400 text-sm">-</span>;
  }

  if (column.key === 'first_translation' && !isEditing && firstTranslation) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-900">{firstTranslation.translated_name}</span>
        <Badge code={firstTranslation.language_code} />
      </div>
    );
  }

  if (column.key === 'translation_votes' && !isEditing && firstTranslation && (firstTranslation.upvotes > 0 || firstTranslation.downvotes > 0)) {
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

  if (column.key === 'is_verified' && !isEditing) {
    return (
      <span className={entry.is_verified ? 'text-green-600' : 'text-gray-400'}>
        {entry.is_verified ? '✓' : '✗'}
      </span>
    );
  }

  // For editable fields (excluding computed and read-only ones)
  const isEditable = EDITABLE_FIELDS.includes(column.key);

  if (isEditing && isEditable) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onKeyDown={onKeyPress}
        onBlur={onCancelEditing}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
        autoFocus
      />
    );
  }

  // Default display with click-to-edit for editable fields
  if (isEditable) {
    return (
      <div
        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm"
        onClick={() => onStartEditing(entry.id, column.key, currentValue)}
        title={isEditable ? 'Click to edit' : ''}
      >
        {displayValue === '-' ? <span className="text-gray-400">{displayValue}</span> : displayValue}
      </div>
    );
  }

  // Read-only display
  return (
    <div className="text-sm text-gray-900">
      {displayValue === '-' ? <span className="text-gray-400">{displayValue}</span> : displayValue}
    </div>
  );
}
