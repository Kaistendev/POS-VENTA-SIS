import React, { TextareaHTMLAttributes, forwardRef } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 rounded-md border bg-gray-800/50 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none ${
            error
              ? 'border-red-500/50'
              : 'border-gray-600 hover:border-gray-500'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  },
);

FormTextarea.displayName = 'FormTextarea';
