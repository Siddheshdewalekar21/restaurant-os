'use client';

import React, { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  id,
  label,
  children,
  error,
  hint,
  required = false,
  className = '',
}: FormFieldProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  
  return (
    <div className={`mb-4 ${className}`}>
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium text-gray-700 ${required ? 'required' : ''}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="mt-1">
        {children}
      </div>
      
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

interface ResponsiveFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: string;
  success?: string;
}

export function ResponsiveForm({
  children,
  onSubmit,
  className = '',
  title,
  description,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting = false,
  error,
  success,
}: ResponsiveFormProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        
        <div className={isMobile ? 'space-y-4' : ''}>
          {children}
        </div>
        
        <div className={`mt-6 ${isMobile ? 'flex flex-col-reverse gap-3' : 'flex justify-end gap-3'}`}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isMobile ? 'w-full' : ''
              }`}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
          )}
          
          <button
            type="submit"
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isMobile ? 'w-full' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className = '' }: FormRowProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  
  if (isMobile) {
    return <div className={`space-y-4 ${className}`}>{children}</div>;
  }
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function Input({
  id,
  label,
  error,
  hint,
  required = false,
  className = '',
  fullWidth = false,
  ...props
}: InputProps) {
  return (
    <FormField
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={fullWidth ? 'md:col-span-2 lg:col-span-3' : className}
    >
      <input
        id={id}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
          error ? 'border-red-300' : ''
        }`}
        {...props}
      />
    </FormField>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function Textarea({
  id,
  label,
  error,
  hint,
  required = false,
  className = '',
  fullWidth = false,
  ...props
}: TextareaProps) {
  return (
    <FormField
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={fullWidth ? 'md:col-span-2 lg:col-span-3' : className}
    >
      <textarea
        id={id}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
          error ? 'border-red-300' : ''
        }`}
        {...props}
      />
    </FormField>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function Select({
  id,
  label,
  options,
  error,
  hint,
  required = false,
  className = '',
  fullWidth = false,
  ...props
}: SelectProps) {
  return (
    <FormField
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={fullWidth ? 'md:col-span-2 lg:col-span-3' : className}
    >
      <select
        id={id}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
          error ? 'border-red-300' : ''
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export function Checkbox({
  id,
  label,
  error,
  hint,
  className = '',
  ...props
}: CheckboxProps) {
  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex h-5 items-center">
        <input
          id={id}
          type="checkbox"
          className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
            error ? 'border-red-300' : ''
          }`}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-gray-700">
          {label}
        </label>
        {hint && !error && <p className="text-gray-500">{hint}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
} 