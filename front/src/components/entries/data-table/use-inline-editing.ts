import { useState } from 'react';
import { entriesService, translationsService } from '@/lib/services';
import type { UpdateEntryRequest, UpdateTranslationRequest, LanguageCode, EntryType } from '@/app/types';

export interface EditingCell {
  entryId: string;
  field: string;
  translationId?: string; // For translation fields
}

export function useInlineEditing(onUpdateEntry: (entryId: string, field: string, value: string) => void) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = (entryId: string, field: string, currentValue: string, translationId?: string) => {
    setEditingCell({ entryId, field, translationId });
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async (valueOverride?: string) => {
    if (!editingCell) return;

    const valueToSave = valueOverride ?? editValue;

    try {
      const entryId: string = editingCell.entryId;

      // Optimistically update the UI first
      onUpdateEntry(editingCell.entryId, editingCell.field, valueToSave);

      // Clear editing state immediately
      setEditingCell(null);
      setEditValue('');

      // Prepare the update data based on field type
      const updateData: UpdateEntryRequest = { id: entryId };

      // Handle entry fields
      const entryFields = ["primary_name", "original_script", "language_code", "entry_type", "alternative_names", "etymology", "definition", "historical_context", "verification_notes"];

      if (entryFields.includes(editingCell.field)) {
        switch (editingCell.field) {
          case 'primary_name':
          case 'original_script':
          case 'etymology':
          case 'definition':
          case 'historical_context':
          case 'verification_notes':
            updateData[editingCell.field] = valueToSave;
            break;
          case 'language_code':
            updateData.language_code = valueToSave as LanguageCode;
            break;
          case 'entry_type':
            updateData.entry_type = valueToSave ? (valueToSave as EntryType) : undefined;
            break;
          case 'alternative_names':
            updateData.alternative_names = valueToSave ? valueToSave.split(', ').map(name => name.trim()) : [];
            break;
        }

        // Call the update API in the background
        try {
          await entriesService.updateEntry(updateData);
        } catch (apiError) {
          console.error('Backend save failed, but UI is already updated:', apiError);
          // TODO: Show error notification and optionally revert the change
        }
      } else if (editingCell.field.startsWith('translation_') || editingCell.field === 'first_translation') {
        // Handle translation fields
        if (!editingCell.translationId) {
          return;
        }

        const translationFields = ["first_translation", "translation_notes"];

        if (translationFields.includes(editingCell.field)) {
          const updateData: UpdateTranslationRequest = { id: editingCell.translationId };

          switch (editingCell.field) {
            case 'first_translation':
              updateData.translated_name = valueToSave;
              break;
            case 'translation_notes':
              updateData.notes = valueToSave;
              break;
          }

          // Call the translation update API in the background
          try {
            await translationsService.updateTranslation(updateData);
          } catch (apiError) {
            console.error('Translation save failed, but UI is already updated:', apiError);
            // TODO: Show error notification and optionally revert the change
          }
        } else {
          console.log('Translation field not supported for editing:', editingCell.field);
        }
      } else {
        console.log('Field not supported for editing:', editingCell.field);
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
      e.preventDefault();
      e.stopPropagation();
      // Use setTimeout to make the save operation asynchronous and not block the keydown handler
      setTimeout(() => {
        saveEdit();
      }, 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEditing();
    }
  };

  // Wrapper for dropdown selections - uses the unified saveEdit function
  const saveEditWithValue = async (value: string) => {
    if (!editingCell) return;

    // Update the edit value first, then save immediately with the value override
    setEditValue(value);
    await saveEdit(value); // Use value override to avoid timing issues
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
