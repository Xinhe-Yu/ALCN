'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType, ToastContainer } from '@/components/ui/toast';
import ConfirmationToast from '@/components/ui/confirmation-toast';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmationToast, setConfirmationToast] = useState<{
    options: ConfirmationOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration: number = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration
    };

    setToasts(prev => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    addToast('success', title, message, duration);
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addToast('error', title, message, duration);
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    addToast('warning', title, message, duration);
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    addToast('info', title, message, duration);
  }, [addToast]);

  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmationToast({ options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmationToast) {
      confirmationToast.resolve(true);
      setConfirmationToast(null);
    }
  }, [confirmationToast]);

  const handleCancel = useCallback(() => {
    if (confirmationToast) {
      confirmationToast.resolve(false);
      setConfirmationToast(null);
    }
  }, [confirmationToast]);

  const value: ToastContextType = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    confirm
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={removeToast}
        confirmationToast={confirmationToast}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
