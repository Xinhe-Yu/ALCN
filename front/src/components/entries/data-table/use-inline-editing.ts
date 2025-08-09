import { useState } from 'react';
import { entriesService } from '@/lib/services';
import type { UpdateEntryRequest, EntryWithTranslations } from '@/app/types';

export interface EditingCell {
  entryId: string;
  field: string;
}

export function useInlineEditing(onUpdateEntry: (entryId: string, field: string, value: string) => void) {
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
      console.log('Saving edit:', editingCell, editValue);
      
      // For now, let's try to use the ID as-is since backend might accept string IDs
      // If backend truly needs numeric IDs, we'll need to check the actual ID format
      let entryId: any = editingCell.entryId;
      
      // Try converting to number if it looks like a number
      const numericId = parseInt(editingCell.entryId, 10);
      if (!isNaN(numericId) && numericId.toString() === editingCell.entryId) {
        entryId = numericId;
      }

      // Prepare the update data based on field type
      const updateData: any = {
        id: entryId
      };

      // Map field names to the correct API field names
      switch (editingCell.field) {
        case 'primary_name':
          updateData.primary_name = editValue;
          break;
        case 'language_code':
          updateData.language_code = editValue as any; // LanguageCode type
          break;
        case 'entry_type':
          updateData.entry_type = editValue || null; // Handle empty string as null
          break;
        case 'description':
        case 'definition': // Map definition to description for now
          updateData.description = editValue;
          break;
        // For now, we'll only handle entry fields, not translation fields
        case 'first_translation':
        case 'translation_language':
        case 'translation_notes':
          console.log('Translation editing not yet implemented for field:', editingCell.field);
          setEditingCell(null);
          setEditValue('');
          return;
        default:
          console.log('Field not supported for editing:', editingCell.field);
          setEditingCell(null);
          setEditValue('');
          return;
      }

      // Optimistically update the UI first
      console.log('Calling optimistic update:', { entryId: editingCell.entryId, field: editingCell.field, value: editValue });
      onUpdateEntry(editingCell.entryId, editingCell.field, editValue);
      
      // Clear editing state immediately
      setEditingCell(null);
      setEditValue('');
      
      // Call the update API in the background
      try {
        await entriesService.updateEntry(updateData);
        console.log('Successfully saved edit to backend');
      } catch (apiError) {
        console.error('Backend save failed, but UI is already updated:', apiError);
        // TODO: Show error notification and optionally revert the change
      }
      
    } catch (error) {
      console.error('Failed to save edit:', error);
      
      // Clear editing state so user isn't stuck
      setEditingCell(null);
      setEditValue('');
      
      // TODO: Show error notification to user
      // TODO: Optionally revert the optimistic update if backend fails
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Save edit with specific value (for dropdowns)
  const saveEditWithValue = async (value: string) => {
    if (!editingCell) return;
    
    // Update the edit value first
    setEditValue(value);
    
    // Then save with the new value
    setTimeout(async () => {
      console.log('Saving with specific value:', { entryId: editingCell.entryId, field: editingCell.field, value });
      
      try {
        // Optimistically update the UI first
        onUpdateEntry(editingCell.entryId, editingCell.field, value);
        
        // Clear editing state immediately
        setEditingCell(null);
        setEditValue('');
        
        // Prepare API call
        let entryId: any = editingCell.entryId;
        const numericId = parseInt(editingCell.entryId, 10);
        if (!isNaN(numericId) && numericId.toString() === editingCell.entryId) {
          entryId = numericId;
        }

        const updateData: any = { id: entryId };

        switch (editingCell.field) {
          case 'language_code':
            updateData.language_code = value;
            break;
          case 'entry_type':
            updateData.entry_type = value || null;
            break;
          default:
            updateData[editingCell.field] = value;
        }

        // Call the update API in the background
        await entriesService.updateEntry(updateData);
        console.log('Successfully saved dropdown edit to backend');
        
      } catch (error) {
        console.error('Failed to save dropdown edit:', error);
      }
    }, 0);
  };

  return {
    editingCell,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    saveEdit,
    saveEditWithValue,
    handleKeyPress,
    isLoading: false // TODO: Add loading state
  };
}