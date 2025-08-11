'use client';

import { useState } from 'react';
import { EntryWithTranslations } from '@/app/types/entries';
import { LanguageCode, EntryType, LANGUAGE_OPTIONS, ENTRY_TYPE_OPTIONS } from '@/app/types/crud';
import { useToast } from '@/lib/context/ToastContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EntryEditFormProps {
  entry: EntryWithTranslations;
  onSave: (updates: EntryUpdateData) => Promise<void>;
  onCancel: () => void;
}

export interface EntryUpdateData {
  primary_name?: string;
  original_script?: string;
  language_code?: LanguageCode;
  entry_type?: EntryType | null;
  alternative_names?: string[];
  other_language_codes?: LanguageCode[];
  etymology?: string;
  definition?: string;
  historical_context?: string;
  verification_notes?: string;
}

export default function EntryEditForm({ entry, onSave, onCancel }: EntryEditFormProps) {
  const [isShortVersion, setIsShortVersion] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  // Form state
  const [formData, setFormData] = useState<EntryUpdateData>({
    primary_name: entry.primary_name || '',
    original_script: entry.original_script || '',
    language_code: entry.language_code as LanguageCode,
    entry_type: entry.entry_type as EntryType | null,
    alternative_names: entry.alternative_names || [],
    other_language_codes: entry.other_language_codes as LanguageCode[] || [],
    etymology: entry.etymology || '',
    definition: entry.definition || '',
    historical_context: entry.historical_context || '',
    verification_notes: entry.verification_notes || '',
  });

  // Alternative names handling
  const [altNameInput, setAltNameInput] = useState('');

  const addAlternativeName = () => {
    if (altNameInput.trim() && !formData.alternative_names?.includes(altNameInput.trim())) {
      setFormData(prev => ({
        ...prev,
        alternative_names: [...(prev.alternative_names || []), altNameInput.trim()]
      }));
      setAltNameInput('');
    }
  };

  const removeAlternativeName = (name: string) => {
    setFormData(prev => ({
      ...prev,
      alternative_names: prev.alternative_names?.filter(n => n !== name) || []
    }));
  };

  const addOtherLanguage = (langCode: LanguageCode) => {
    if (!formData.other_language_codes?.includes(langCode)) {
      setFormData(prev => ({
        ...prev,
        other_language_codes: [...(prev.other_language_codes || []), langCode]
      }));
    }
  };

  const removeOtherLanguage = (langCode: LanguageCode) => {
    setFormData(prev => ({
      ...prev,
      other_language_codes: prev.other_language_codes?.filter(l => l !== langCode) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.primary_name?.trim()) {
      error('Error', 'Primary name is required');
      return;
    }

    setIsSaving(true);
    try {
      // Only send changed fields
      const updates: EntryUpdateData = {};
      Object.keys(formData).forEach(key => {
        const fieldKey = key as keyof EntryUpdateData;
        const currentValue = formData[fieldKey];
        const originalValue = entry[fieldKey];
        
        if (currentValue !== originalValue) {
          (updates as Record<string, unknown>)[fieldKey] = currentValue;
        }
      });

      if (Object.keys(updates).length === 0) {
        success('Info', 'No changes to save');
        onCancel();
        return;
      }

      // Convert EntryType to string for API call
      const apiUpdates = { ...updates };
      if (apiUpdates.entry_type === null) {
        // Convert null to undefined for API
        apiUpdates.entry_type = undefined;
      }
      await onSave(apiUpdates);
      success('Success', 'Entry updated successfully');
      onCancel();
    } catch (err) {
      console.error('Failed to update entry:', err);
      error('Error', 'Failed to update entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Essential fields for short version
  const isEssentialFieldsValid = formData.primary_name?.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity" onClick={onCancel} />

        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-4xl w-full mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Entry
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
                  {/* Primary Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Name *
                    </label>
                    <input
                      type="text"
                      value={formData.primary_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>

                  {/* Language Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language *
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

                  {/* Entry Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Type
                    </label>
                    <select
                      value={formData.entry_type || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        entry_type: e.target.value ? e.target.value as EntryType : null 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="">Other</option>
                      {Object.entries(ENTRY_TYPE_OPTIONS).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Definition */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Definition
                    </label>
                    <textarea
                      value={formData.definition || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Extended Fields - Only shown when not in short version */}
                {!isShortVersion && (
                  <>
                    <hr className="my-6" />
                    <h4 className="text-md font-medium text-gray-900 mb-4">Extended Fields</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Original Script */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Original Script
                        </label>
                        <input
                          type="text"
                          value={formData.original_script || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, original_script: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Original text in native script"
                        />
                      </div>

                      {/* Alternative Names */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternative Names
                        </label>
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={altNameInput}
                              onChange={(e) => setAltNameInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlternativeName())}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                              placeholder="Add alternative name"
                            />
                            <button
                              type="button"
                              onClick={addAlternativeName}
                              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.alternative_names?.map((name) => (
                              <span key={name} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                                {name}
                                <button
                                  type="button"
                                  onClick={() => removeAlternativeName(name)}
                                  className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Other Language Codes */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Other Language Codes
                        </label>
                        <div className="space-y-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addOtherLanguage(e.target.value as LanguageCode);
                                e.target.value = '';
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                          >
                            <option value="">Add language</option>
                            {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                              <option key={code} value={code} disabled={formData.other_language_codes?.includes(code as LanguageCode)}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-wrap gap-2">
                            {formData.other_language_codes?.map((langCode) => (
                              <span key={langCode} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                                {LANGUAGE_OPTIONS[langCode]}
                                <button
                                  type="button"
                                  onClick={() => removeOtherLanguage(langCode)}
                                  className="ml-1 text-blue-500 hover:text-blue-700"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Etymology */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Etymology
                        </label>
                        <textarea
                          value={formData.etymology || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, etymology: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Origin and history of the term"
                        />
                      </div>

                      {/* Historical Context */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Historical Context
                        </label>
                        <textarea
                          value={formData.historical_context || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, historical_context: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Historical background and context"
                        />
                      </div>

                      {/* Verification Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verification Notes
                        </label>
                        <textarea
                          value={formData.verification_notes || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, verification_notes: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Notes about verification and sources"
                        />
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