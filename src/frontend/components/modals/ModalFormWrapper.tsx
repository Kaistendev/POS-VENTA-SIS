import { ReactNode } from 'react';

interface ModalFormWrapperProps {
  title: string;
  loading?: boolean;
  error?: string;
  children: ReactNode;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
}

export default function ModalFormWrapper({
  title,
  loading = false,
  error = '',
  children,
  onCancel,
  onSubmit,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  submitDisabled = false,
}: ModalFormWrapperProps) {
  return (
    <div className="min-h-screen bg-[#1a1b26] p-6">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={loading || submitDisabled}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
