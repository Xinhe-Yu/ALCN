'use client';

import { useState } from 'react';
import { Translation } from '@/app/types/entries';
import { LanguageCode, LANGUAGE_OPTIONS } from '@/app/types/crud';
import { useToast } from '@/lib/context/ToastContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TranslationEditFormProps {
  translation: Translation;
  onSave: (updates: TranslationUpdateData) => Promise<void>;
  onCancel: () => void;
}

export interface TranslationUpdateData {
  translated_name?: string;
  language_code?: LanguageCode;
  notes?: string;
  is_preferred?: boolean;
}

export default function TranslationEditForm({ translation, onSave, onCancel }: TranslationEditFormProps) {
  const [isShortVersion, setIsShortVersion] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  // Form state
  const [formData, setFormData] = useState<TranslationUpdateData>({
    translated_name: translation.translated_name || '',
    language_code: translation.language_code as LanguageCode,
    notes: translation.notes || '',
    is_preferred: translation.is_preferred || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.translated_name?.trim()) {
      error('Error', 'Translation name is required');
      return;
    }

    if (!formData.language_code) {
      error('Error', 'Language is required');
      return;
    }

    setIsSaving(true);
    try {
      // Only send changed fields
      const updates: TranslationUpdateData = {};
      Object.keys(formData).forEach(key => {
        const fieldKey = key as keyof TranslationUpdateData;
        const currentValue = formData[fieldKey];
        const originalValue = translation[fieldKey];
        
        if (currentValue !== originalValue) {
          (updates as Record<string, unknown>)[fieldKey] = currentValue;
        }
      });

      if (Object.keys(updates).length === 0) {
        success('Info', 'No changes to save');
        onCancel();
        return;
      }

      await onSave(updates);
      success('Success', 'Translation updated successfully');
      onCancel();
    } catch (err) {
      console.error('Failed to update translation:', err);
      error('Error', 'Failed to update translation');
    } finally {
      setIsSaving(false);
    }
  };

  // Essential fields for short version
  const isEssentialFieldsValid = formData.translated_name?.trim() && formData.language_code;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity" onClick={onCancel} />

        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-2xl w-full mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Translation
                </h3>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isShortVersion}
                      onChange={(e) => setIsShortVersion(e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Short version (essential fields only)</span>
                  </label>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Essential Fields - Always Shown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Translation Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Translation *
                    </label>
                    <input
                      type="text"
                      value={formData.translated_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, translated_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Enter the translation"
                      required
                    />
                  </div>

                  {/* Language Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Language *
                    </label>
                    <select
                      value={formData.language_code || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, language_code: e.target.value as LanguageCode }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                      required
                    >
                      <option value="">Select Language</option>
                      {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Is Preferred */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_preferred"
                      checked={formData.is_preferred || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_preferred: e.target.checked }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="is_preferred" className="ml-2 text-sm text-gray-700">
                      Mark as preferred translation
                    </label>
                  </div>
                </div>

                {/* Extended Fields - Only shown when not in short version */}
                {!isShortVersion && (
                  <>
                    <hr className="my-6" />
                    <h4 className="text-md font-medium text-gray-900 mb-4">Extended Fields</h4>
                    
                    <div className="space-y-4">
                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes & Context
                        </label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Additional notes, context, or explanations about this translation..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Add context, usage notes, regional variations, or explanations that help users understand this translation better.
                        </p>
                      </div>

                      {/* Translation Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Translation Statistics</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Upvotes:</span> {translation.upvotes}
                          </div>
                          <div>
                            <span className="font-medium">Downvotes:</span> {translation.downvotes}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(translation.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Updated:</span> {new Date(translation.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Help Text */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-900 mb-1">Translation Guidelines</h5>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Provide the most accurate translation possible</li>
                          <li>• Consider cultural and historical context</li>
                          <li>• Use notes to explain regional variations or special meanings</li>
                          <li>• Mark as preferred only if this is the best/most common translation</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={!isEssentialFieldsValid || isSaving}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                  isEssentialFieldsValid && !isSaving
                    ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' 
                    : 'bg-gray-400 cursor-not-allowed'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}