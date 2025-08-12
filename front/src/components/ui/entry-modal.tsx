'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import EntryItem from '../entries/entry-item';
import type { EntryWithTranslations, EntryWithTranslationsAndVotes } from '@/app/types';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: EntryWithTranslations | EntryWithTranslationsAndVotes | null;
  onEntryUpdate?: (updatedEntry: EntryWithTranslations | EntryWithTranslationsAndVotes) => void;
}

export default function EntryModal({ isOpen, onClose, entry, onEntryUpdate }: EntryModalProps) {
  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      onClick={handleBackdropClick}
    >
      {/* Right-side modal panel */}
      <div
        className="fixed inset-y-0 right-0 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl bg-gray-50 shadow-xl transform transition-all duration-300 ease-out ml-4 sm:ml-6 md:ml-16"
        style={{
          animation: isOpen ? 'slideInFromRight 0.3s ease-out' : 'slideOutToRight 0.2s ease-in'
        }}
      >
        {/* Modal content */}
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Entry Details
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close panel</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <EntryItem
              entry={entry}
              type="entry"
              showDate={true}
              isModal={true}
              defaultExpanded={true}
              onEntryUpdate={onEntryUpdate}
            />
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutToRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}