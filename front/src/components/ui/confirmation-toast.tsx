'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmationToastProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
}

const ConfirmationToast = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}: ConfirmationToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(() => {
      onConfirm();
    }, 300);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  const getBorderColor = () => {
    return type === 'danger' ? 'border-red-200' : 'border-yellow-200';
  };

  const getBackgroundColor = () => {
    return type === 'danger' ? 'bg-red-50' : 'bg-yellow-50';
  };

  const getButtonColors = () => {
    return type === 'danger' 
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
  };

  return (
    <div
      className={`
        max-w-md w-full bg-white border-l-4 rounded-lg shadow-lg pointer-events-auto overflow-hidden
        transition-all duration-300 ease-in-out transform
        ${getBorderColor()} ${getBackgroundColor()}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className={`h-6 w-6 ${type === 'danger' ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {message}
            </p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleConfirm}
                className={`
                  inline-flex justify-center px-3 py-2 text-xs font-medium text-white border border-transparent rounded-md
                  ${getButtonColors()}
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                `}
              >
                {confirmText}
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {cancelText}
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={handleCancel}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationToast;