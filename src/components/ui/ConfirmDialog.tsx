import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: 'border-red-500/20 bg-red-500/10',
  warning: 'border-yellow-500/20 bg-yellow-500/10',
  info: 'border-blue-500/20 bg-blue-500/10',
};

const iconColors = {
  danger: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className={`flex items-start gap-3 p-4 border-b border-gray-700 ${variantStyles[variant]}`}>
          <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${iconColors[variant]}`} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-300 mt-1">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : variant === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
