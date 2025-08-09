import { useState } from 'react';
import { entriesService } from '@/lib/services';

export interface EditingCell {
  entryId: string;
  field: string;
}

export function useInlineEditing(onRefresh: () => Promise<void>) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = (entryId: string, field: string, currentValue: string) => {
    setEditingCell({ entryId, field });
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      // Here you would call your update API
      console.log('Saving edit:', editingCell, editValue);
      // await entriesService.updateEntry(editingCell.entryId, { [editingCell.field]: editValue });

      // Refresh data after successful edit
      await onRefresh();
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to save edit:', error);
      // Handle error - maybe show a toast
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return {
    editingCell,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    saveEdit,
    handleKeyPress
  };
}